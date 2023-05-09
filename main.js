
import * as THREE from 'three';
import RAPIER from 'https://cdn.skypack.dev/@dimforge/rapier3d-compat';

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

await init();
async function init() {

    scene_setup();

    await RAPIER.init();
    let gravity = {x: 0.0, y: -9.81, z: 0.0};
    world = new RAPIER.World(gravity);
    eventQueue = new RAPIER.EventQueue(true);

    let groundColliderDesc = RAPIER.ColliderDesc.cuboid(10.0, 1, 10.0);
    groundColliderDesc.setTranslation(0, -1, 0);
    ground_collider = world.createCollider(groundColliderDesc);
    ground_collider.ignore_controller = true;

    scene.add(pointer_target);

	transform_ctrl = new TransformControls(camera, renderer.domElement);
	transform_ctrl.addEventListener('change', render);
	transform_ctrl.addEventListener('dragging-changed', function (event) {
     	controls.enabled = ! event.value;
	});
	transform_ctrl.size = 0.75
	transform_ctrl.setSpace("local");
	transform_ctrl.attach(pointer_target);

	scene.add(transform_ctrl);

    pointer_target.position.set(0, 0.75, 0);
    pointer_target.rotateX(-Math.PI/2);

    let width = 0.1
    let height = 0.5
    let depth = 0.1
    let color = new THREE.Color();


    color.setHex(0xffffff * Math.random());

    let body_desc = RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(0, 1, 0);
    // let body_desc = RAPIER.RigidBodyDesc.dynamic().setTranslation(0, 1, 0);
    body_desc.setCanSleep(false);
    let rigid_body = world.createRigidBody(body_desc);
    let geometry = new THREE.BoxGeometry(width, height, depth);
    let mesh = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({color: color}));
    scene.add(mesh);
    let collider = world.createCollider(RAPIER.ColliderDesc.cuboid(width/2, height/2, depth/2), rigid_body);
    boxes.push({
        r: rigid_body,
        c: collider,
        m: mesh
    });


    color.setHex(0xffffff * Math.random());
    body_desc = RAPIER.RigidBodyDesc.dynamic().setTranslation(0.05, 1, 0);
    body_desc.setCanSleep(false);
    rigid_body = world.createRigidBody(body_desc);
    geometry = new THREE.BoxGeometry(width, height, depth);
    mesh = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({color: color}));
    scene.add(mesh);
    collider = world.createCollider(RAPIER.ColliderDesc.cuboid(width/2, height/2, depth/2), rigid_body);
    boxes.push({
        r: rigid_body,
        c: collider,
        m: mesh
    });

    // let joint = world.createMultibodyJoint(RAPIER.JointData.revolute(
    //     {x: 0.12, y: 0.25, z: 0}, {x: 0, y: 0.25, z: 0}, {x: 1, y: 1, z: 0}), boxes[0].r, boxes[1].r, true);
    // joint.setContactsEnabled(false);

    let joint = world.createMultibodyJoint(RAPIER.JointData.revolute(
        {x: 0.12, y: 0.25, z: 0}, {x: 0, y: 0.25, z: 0}, {x: 1, y: 0, z: 0}), boxes[0].r, boxes[1].r, true);
    joint.setContactsEnabled(false);

    renderer.setAnimationLoop(render);
}

function render() {

    if (boxes.length > 0) {
        let p = pointer_target.position;
        boxes[0].r.setNextKinematicTranslation({x: p.x, y: p.y, z: p.z}, true);
        let q = pointer_target.quaternion;
        boxes[0].r.setNextKinematicRotation({w: q.w, x: q.x, y: q.y, z: q.z}, true);
    }

    for (let i = 0; i < boxes.length; i++) {
        let p = boxes[i].r.translation();
        let q = boxes[i].r.rotation();
        boxes[i].m.position.set(p.x, p.y, p.z);
        boxes[i].m.quaternion.set(q.x, q.y, q.z, q.w);
    }

    world.step(eventQueue);

    renderer.render(scene, camera);
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
    camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    camera.position.set(0, 1.5, 2.2);
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

    const helper = new THREE.GridHelper(20, 20);
    helper.material.opacity = 0.25;
    helper.material.transparent = true;
    scene.add( helper );

    controls = new OrbitControls(camera, renderer.domElement);
    controls.damping = 0.2;
    controls.addEventListener('change', render);

    const axesHelper = new THREE.AxesHelper(1);
    scene.add(axesHelper);
}
