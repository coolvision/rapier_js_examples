
import * as THREE from 'three';
// import RAPIER from 'https://cdn.skypack.dev/@dimforge/rapier3d-compat';
import RAPIER from './lib/rapier.es';
import Stats from './lib/stats.module';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';

import * as utils from './rapier_utils.js'

let container;
let camera, scene, renderer, controls;
let transform_ctrl;
let pointer_target = new THREE.Mesh();

let world;
let eventQueue;
let ground_collider;
let boxes = [];

var stats = new Stats();
stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild( stats.dom );

let clock = new THREE.Clock();
let delta = 0;
let interval = 1 / 30; // 30 fps
function update() {
    requestAnimationFrame(update);
    delta += clock.getDelta();
    if (delta  > interval) {
       // The draw or time dependent code are here
       render();
       delta = delta % interval;
    }
}

await init();
async function init() {

    scene_setup();

    await RAPIER.init();
    let gravity = {x: 0.0, y: -9.81, z: 0.0};
    world = new RAPIER.World(gravity);
    eventQueue = new RAPIER.EventQueue(true);
    let ip = world.integrationParameters;
    ip.erp = 0.8;

    let ground_size = 200.1;
    let ground_height = 0.1;
    // let ground_desc = RAPIER.RigidBodyDesc.fixed().setTranslation(0, -10, 0);
    let ground_desc = RAPIER.RigidBodyDesc.fixed().setTranslation(0, -ground_height, 0);
    let ground_body = world.createRigidBody(ground_desc);
    let ground_collider_desc = RAPIER.ColliderDesc.cuboid(ground_size, ground_height, ground_size);
    ground_collider = world.createCollider(ground_collider_desc, ground_body);

    let color = new THREE.Color();
    color.setHex(0xffffff * Math.random());

    let body_desc = RAPIER.RigidBodyDesc.fixed().setTranslation(0, 10, 0);
    let rigid_body = world.createRigidBody(body_desc);
    let geometry = new THREE.BoxGeometry(2.0*2, 6.0*2, 0.5*2);
    let mesh = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({color: color}));
    scene.add(mesh);
    let collider = world.createCollider(RAPIER.ColliderDesc.cuboid(2.0, 6.0, 0.5), rigid_body);
    boxes.push({
        r: rigid_body,
        c: collider,
        m: mesh
    });

    let body_desc2 = RAPIER.RigidBodyDesc.dynamic();
    let rigid_body2 = world.createRigidBody(body_desc2);
    let geometry2 = new THREE.BoxGeometry(2.0*2, 6.0*2, 0.5*2);
    let mesh2 = new THREE.Mesh(geometry2, new THREE.MeshLambertMaterial({color: color}));
    scene.add(mesh2);
    let collider2 = world.createCollider(RAPIER.ColliderDesc.cuboid(2.0, 6.0, 0.5), rigid_body2);
    boxes.push({
        r: rigid_body2,
        c: collider2,
        m: mesh2
    });


    // let joint = world.createImpulseJoint(RAPIER.JointData.revolute(
    //     {x: 0, y: 0, z: 0}, {x: 0, y: 2, z: -3}, {x: 0, y: 0, z: 1}), boxes[0].r, boxes[1].r, true);

    let joint = world.createMultibodyJoint(RAPIER.JointData.revolute(
        {x: 0, y: 0, z: 0}, {x: 0, y: 2, z: -3}, {x: 0, y: 0, z: 1}), boxes[0].r, boxes[1].r, true);

    // joint.setContactsEnabled(false);
    joint.configureMotorVelocity(6.28, 1000.0);


    // console.log("joint", joint)

    renderer.setAnimationLoop(render);
    // update();
}

function render() {
    stats.begin();
    // if (boxes.length > 0) {
    //     let p = pointer_target.position;
    //     boxes[0].r.setNextKinematicTranslation({x: p.x, y: p.y, z: p.z}, true);
    //     let q = pointer_target.quaternion;
    //     boxes[0].r.setNextKinematicRotation({w: q.w, x: q.x, y: q.y, z: q.z}, true);
    // }

    for (let i = 0; i < boxes.length; i++) {
        let p = boxes[i].r.translation();
        let q = boxes[i].r.rotation();
        boxes[i].m.position.set(p.x, p.y, p.z);
        boxes[i].m.quaternion.set(q.x, q.y, q.z, q.w);
    }

    world.step(eventQueue);

    renderer.render(scene, camera);

    stats.end();
}

function scene_setup() {

    container = document.querySelector('body');

    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setPixelRatio(window.devicePixelRatio);
    let w = window.visualViewport.width;
    let h = window.visualViewport.height;
    renderer.setSize(w, h);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    window.addEventListener('resize', function() {
        let w = window.visualViewport.width;
        let h = window.visualViewport.height;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
        render();
    });

    scene = new THREE.Scene();
	scene.background = new THREE.Color(0x999999);
    camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
    camera.position.set(50.0, 50.0, 50.0);
    camera.lookAt(5.0, 5.0, 5.0);

    scene.add(camera);

    scene.add(new THREE.AmbientLight(0xf0f0f0));
    const light = new THREE.SpotLight(0xffffff, 1.5);
    light.position.set(0, 15, 2);
    light.angle = Math.PI * 0.2;
    light.castShadow = true;
    light.shadow.camera.near = 2;
    light.shadow.camera.far = 20;
    light.shadow.bias = - 0.000222;
    light.shadow.mapSize.width = 1024;
    light.shadow.mapSize.height = 1024;
    scene.add(light);

    const helper = new THREE.GridHelper(200, 200);
    helper.material.opacity = 0.25;
    helper.material.transparent = true;
    scene.add(helper);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.damping = 0.2;
    controls.addEventListener('change', render);

    const axesHelper = new THREE.AxesHelper(1);
    scene.add(axesHelper);
}

window.addEventListener('keydown', function(event) {

    switch (event.code) {
        case "KeyZ":
            world.step(eventQueue);
            break;
    }
});
