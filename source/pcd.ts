import * as lzfjs from "lzfjs";

type Field = "x" | "y" | "z" | "rgb" | "rgba";
type Type = "i" | "u" | "f";
type Data = "ascii" | "binary" | "binary_compressed";

interface IPcdHeader {
    version: number;
    fields: Field[];
    size: number[];
    type: Type[];
    count: number[];
    height: number;
    width: number;
    points: number;
    data: Data;
}

interface IPcd {
    header: IPcdHeader;
    positions: Float32Array | null;
}

const littleEndian = true;

export async function load(path: string): Promise<IPcd> {
    const response = await fetch(path);
    return parse(await response.arrayBuffer());
}

function parse(buffer: ArrayBuffer): IPcd {
    const { header, body } = parseHeader(buffer);

    const { offsets, size } = calculateOffsets(header);

    let positions: Float32Array | null = null;
    if (offsets.x !== null && offsets.y !== null && offsets.z !== null) {
        positions = new Float32Array(header.points * 3);
    }

    if (header.data === "ascii") {
        const dataString: string = String.fromCharCode.apply(
            null,
            new Uint8Array(body)
        );

        const lines = dataString.split("\n");
        lines.forEach((line, i) => {
            const column = line.split(" ");

            if (positions) {
                positions[i * 3 + 0] = parseFloat(column[offsets.x || 0]);
                positions[i * 3 + 1] = parseFloat(column[offsets.y || 0]);
                positions[i * 3 + 2] = parseFloat(column[offsets.z || 0]);
            }
        });
    } else if (header.data === "binary") {
        const view = new DataView(body);

        range(0, header.points).forEach(i => {
            if (positions) {
                positions[i * 3 + 0] = view.getFloat32(
                    size * i + (offsets.x || 0),
                    littleEndian
                );
                positions[i * 3 + 1] = view.getFloat32(
                    size * i + (offsets.y || 0),
                    littleEndian
                );
                positions[i * 3 + 2] = view.getFloat32(
                    size * i + (offsets.z || 0),
                    littleEndian
                );
            }
        });
    } else if (header.data === "binary_compressed") {
        const uncompressed = decompress(body);
        const view = new DataView(uncompressed);

        range(0, header.points).forEach(i => {
            if (positions) {
                positions[i * 3 + 0] = view.getFloat32(
                    (offsets.x || 0) + i * 4,
                    littleEndian
                );
                positions[i * 3 + 1] = view.getFloat32(
                    (offsets.y || 0) + i * 4,
                    littleEndian
                );
                positions[i * 3 + 2] = view.getFloat32(
                    (offsets.z || 0) + i * 4,
                    littleEndian
                );
            }
        });
    }

    return {
        header,
        positions
    };
}

interface IOffsets {
    x?: number;
    y?: number;
    z?: number;
}
function calculateOffsets(
    header: IPcdHeader
): { offsets: IOffsets; size: number } {
    const empty: IOffsets = {};
    return header.fields.reduce(
        ({ offsets, size }, field, i) => {
            if (field === "x") {
                offsets.x = size;
            }
            if (field === "y") {
                offsets.y = size;
            }
            if (field === "z") {
                offsets.z = size;
            }
            if (header.data === "ascii") {
                size = size + 1;
            } else if (header.data === "binary") {
                size = size + header.size[i];
            } else if (header.data === "binary_compressed") {
                size = size + header.size[i] * header.points;
            }
            return {
                offsets,
                size
            };
        },
        {
            offsets: empty,
            size: 0
        }
    );
}

function parseHeader(
    buffer: ArrayBuffer
): { header: IPcdHeader; body: ArrayBuffer } {
    const { header, body } = extractHeader(buffer);

    const versionMatch = /VERSION (.*)/i.exec(header);
    if (versionMatch === null) {
        throw new Error("Missing version");
    }
    const version = parseFloat(versionMatch[1]);

    const fieldsMatch = /FIELDS (.*)/i.exec(header);
    if (!fieldsMatch) {
        throw new Error("Missing fields");
    }
    const fields = fieldsMatch[1].split(" ") as Field[];

    const sizeMatch = /SIZE (.*)/i.exec(header);
    if (!sizeMatch) {
        throw new Error("Missing size");
    }
    const size = sizeMatch[1].split(" ").map(_ => parseInt(_, 10));

    const typeMatch = /TYPE (.*)/i.exec(header);
    if (!typeMatch) {
        throw new Error("Missing type");
    }
    const type = typeMatch[1].split(" ") as Type[];

    const countMatch = /COUNT (.*)/i.exec(header);
    let optionalCount: number[] | null = null;
    if (countMatch) {
        optionalCount = countMatch[1].split(" ").map(_ => parseInt(_, 10));
    }
    const count = optionalCount || fields.map(_ => 1);

    const widthMatch = /WIDTH (.*)/i.exec(header);
    if (!widthMatch) {
        throw new Error("Missing width");
    }
    const width = parseInt(widthMatch[1], 10);

    const heightMatch = /HEIGHT (.*)/i.exec(header);
    if (!heightMatch) {
        throw new Error("Missing height");
    }
    const height = parseInt(heightMatch[1], 10);

    const pointsMatch = /POINTS (.*)/i.exec(header);
    let optionalPoints: number | null = null;
    if (pointsMatch) {
        optionalPoints = parseInt(pointsMatch[1], 10);
    }
    const points = optionalPoints || width * height;

    const dataMatch = /DATA (.*)/i.exec(header);
    if (!dataMatch) {
        throw new Error("Missing data");
    }
    const data = dataMatch[1] as Data;

    return {
        body,
        header: {
            count,
            data,
            fields,
            height,
            points,
            size,
            type,
            version,
            width
        }
    };
}

function extractHeader(
    buffer: ArrayBuffer
): { header: string; body: ArrayBuffer } {
    const chars = new Uint8Array(buffer);
    let header = "";

    let i = 0;
    for (
        ;
        i < chars.length && header.search(/[\r\n]DATA\s(\S*)\s/i) === -1;
        i++
    ) {
        header += String.fromCharCode(chars[i]);
    }
    return {
        body: buffer.slice(i),
        header: header.replace(/\#.*/gi, "")
    };
}

function decompress(data: ArrayBuffer): ArrayBufferLike {
    const sizes = new Uint32Array(data.slice(0, 8));
    const compressedSize = sizes[0];
    const decompressedSize = sizes[1];
    return lzfjs.decompress(new Uint8Array(data, 8, compressedSize)).buffer;
}

function range(start: number, end: number): number[] {
    return new Array(end - start).fill(0).map((_, i) => i + start);
}
