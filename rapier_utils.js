
import * as THREE from 'three';
import RAPIER from 'https://cdn.skypack.dev/@dimforge/rapier3d-compat';

export function getColliderDesc(world, scene, f, width, height, depth, color=0x333333) {



    return {
        cd: collider_desc,
        m: mesh,
        i: mesh.geometry.parameters,
        w: width,
        h: height,
        d: depth
    }
}

export function addBody(type, shape, world, scene, g, m, f, d,
    width, height, depth, x=0, y=0, z=0, color=0x333333) {


    return {
        r: rigid_body,
        c: collider,
        m: cd.m,
        i: cd.m.geometry.parameters,
        t: type,
        w: width,
        h: height,
        d: depth
    }
}
