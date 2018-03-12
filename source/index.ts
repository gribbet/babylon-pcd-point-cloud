import * as babylon from "babylonjs";

import { load as loadPcd } from "./pcd";

const canvas = document.querySelector("canvas") as HTMLCanvasElement;
const engine = new babylon.Engine(canvas);

const scene = new babylon.Scene(engine);
scene.clearColor = new babylon.Color4(0.8, 0.8, 0.8);

const camera = new babylon.ArcRotateCamera(
    "Camera",
    Math.PI / 4,
    Math.PI / 4,
    1,
    babylon.Vector3.Zero(),
    scene
);
camera.minZ = 0;
camera.lowerRadiusLimit = 0.1;
camera.attachControl(canvas, true);

const light = new babylon.PointLight(
    "light",
    new babylon.Vector3(1, 1, 1),
    scene
);

async function load() {
    console.time("pcd");
    const pcd = await loadPcd(require("./bunny.pcd"));
    console.timeEnd("pcd");

    console.time("create");

    const positions = pcd.positions;
    if (!positions) {
        throw new Error("Load failed");
    }

    const points = new babylon.Mesh("points", scene);

    points.setVerticesData(babylon.VertexBuffer.PositionKind, positions);
    points.setIndices([]);

    const material = new babylon.StandardMaterial("material", scene);
    material.emissiveColor = babylon.Color3.Red();
    material.alpha = 0.1;
    material.pointsCloud = true;
    material.pointSize = 5;
    material.disableLighting = true;

    points.material = material;

    const bounds = points.getBoundingInfo().boundingSphere;
    camera.target = bounds.center;
    camera.radius = bounds.radius * 4;

    console.timeEnd("create");

    console.log(
        `Loaded ${pcd.header.points} points. Center: ${
            bounds.center
        }, Radius: ${bounds.radius}`
    );
}

const renderLoop = () => {
    scene.render();
};
engine.runRenderLoop(renderLoop);

window.addEventListener("resize", () => engine.resize());

load();
