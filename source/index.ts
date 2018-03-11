import * as babylon from "babylonjs";

const canvas = document.querySelector("canvas") as HTMLCanvasElement;
const engine = new babylon.Engine(canvas);
const scene = new babylon.Scene(engine);
scene.clearColor = new babylon.Color4(0.8, 0.8, 0.8);
const camera = new babylon.FreeCamera(
    "camera",
    new babylon.Vector3(0, 0, -10),
    scene
);
const light = new babylon.PointLight(
    "light",
    new babylon.Vector3(10, 10, 0),
    scene
);

const box = babylon.Mesh.CreateBox("box", 2, scene);
box.rotation.x = -0.2;
box.rotation.y = -0.4;

const boxMaterial = new babylon.StandardMaterial("material", scene);
boxMaterial.emissiveColor = new babylon.Color3(0, 0.58, 0.86);
box.material = boxMaterial;

const torus = babylon.Mesh.CreateTorus("torus", 2, 0.5, 15, scene);
torus.position.x = -5;
torus.rotation.x = 1.5;

const torusMaterial = new babylon.StandardMaterial("material", scene);
torusMaterial.emissiveColor = new babylon.Color3(0.4, 0.4, 0.4);
torus.material = torusMaterial;

const cylinder = babylon.Mesh.CreateCylinder("cylinder", 2, 2, 2, 12, 1, scene);
cylinder.position.x = 5;
cylinder.rotation.x = -0.2;

const cylinderMaterial = new babylon.StandardMaterial("material", scene);
cylinderMaterial.emissiveColor = new babylon.Color3(1, 0.58, 0);
cylinder.material = cylinderMaterial;

let t = 0;
const renderLoop = () => {
    scene.render();
    t -= 0.01;
    box.rotation.y = t * 2;
    torus.scaling.z = Math.abs(Math.sin(t * 2)) + 0.5;
    cylinder.position.y = Math.sin(t * 3);
};
engine.runRenderLoop(renderLoop);

window.addEventListener("resize", () => engine.resize());
