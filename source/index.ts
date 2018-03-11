import * as babylon from "babylonjs";

import * as pcd from "./pcd";

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
camera.lowerRadiusLimit = 0.5;
camera.attachControl(canvas, true);

const light = new babylon.PointLight(
    "light",
    new babylon.Vector3(1, 1, 1),
    scene
);

async function load() {
    const bunny = await pcd.load(require("./bunny.pcd"));
    const vertices = bunny.position;
    if (!vertices) {
        throw new Error("Load failed");
    }

    const system = new babylon.SolidParticleSystem("system", scene, {
        updatable: false
    });
    const model = babylon.MeshBuilder.CreateSphere(
        "model",
        { diameter: 0.02 },
        scene
    );
    system.addShape(model, bunny.header.points, {
        positionFunction: (particle: any, i: number) => {
            particle.position.x = vertices[i * 3 + 0];
            particle.position.y = vertices[i * 3 + 1];
            particle.position.z = vertices[i * 3 + 2];
        }
    });
    system.buildMesh();
    model.dispose();
}

const renderLoop = () => {
    scene.render();
};
engine.runRenderLoop(renderLoop);

window.addEventListener("resize", () => engine.resize());

load();
