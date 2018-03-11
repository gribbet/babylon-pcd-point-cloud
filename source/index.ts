import "./PCDLoader.js";

import * as THREE from "three";
import { OrbitControls } from "three-orbitcontrols-ts";

const bun = require("./bun.pcd");

const scene = new THREE.Scene();

const renderer = new THREE.WebGLRenderer({ antialias: true });

renderer.setClearColor("#000000");
renderer.setSize(window.innerWidth, window.innerHeight);

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.z = 1;

const controls = new OrbitControls(camera, renderer.domElement);

document.body.appendChild(renderer.domElement);

window.addEventListener("resize", () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

const loader = new (THREE as any).PCDLoader();

loader.load(bun, (mesh: any) => {
    console.log(mesh);
    scene.add(mesh);
});

const render = () => {
    requestAnimationFrame(render);

    renderer.render(scene, camera);
};

render();
