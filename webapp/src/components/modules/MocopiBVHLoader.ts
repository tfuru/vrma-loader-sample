import * as THREE from 'three';
import { AnimationClip, Loader, LoadingManager } from 'three';

import { BVHLoader } from 'three/examples/jsm/loaders/BVHLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

export interface VRMA {
    clip: AnimationClip;
}

export class MocopiBVHLoader extends Loader {
    // ボーンリストの生成
    private nameList = [
        'head',
        'neck',
        'chest',
        'spine',
        'hips',
        'rightShoulder',
        'rightUpperArm',
        'rightLowerArm',
        'rightHand',
        'leftShoulder',
        'leftUpperArm',
        'leftLowerArm',
        'leftHand',
        'rightUpperLeg',
        'rightLowerLeg',
        'rightFoot',
        'leftUpperLeg',
        'leftLowerLeg',
        'leftFoot',
    ];

    // mocopi BVHのボーンリスト
    // https://www.sony.net/Products/mocopi-dev/jp/documents/Home/TechSpec.html
    // Unity Humanoid Avatar
    // https://wiki.virtualcast.jp/wiki/unity/humanoid

    private idList = [
        'root',
        'neck_1',
        'torso_6',
        'torso_3',
        'root',
        'r_shoulder',
        'r_up_arm',
        'r_low_arm',
        'r_hand',
        'l_shoulder',
        'l_up_arm',
        'l_low_arm',
        'l_hand',
        'r_up_leg',
        'r_low_leg',
        'r_foot',
        'l_up_leg',
        'l_low_leg',
        'l_foot',
    ];

    private bvhLoader = new BVHLoader();

    // トラックの取得
    private findTrack = (name: string, tracks: any[]) => {
        for (let i = 0; i < tracks.length; i++) {
            if (tracks[i].name == name) return tracks[i];
        }
        return null;
    }

    // 配列をQuaternionに変換
    private values2quaternion = (values: any[], i: number) => {
        return new THREE.Quaternion(
            values[i * 4],
            values[i * 4 + 1],
            values[i * 4 + 2],
            values[i * 4 + 3]
        );
    }

    // キーリストの生成
    private createKeys = (i: number, id: string, tracks: any[]) => {
        const posTrack = this.findTrack(`${id}.position`, tracks);
        const rotTrack = this.findTrack(`${id}.quaternion`, tracks);
        // console.log("createKeys", id, posTrack, rotTrack);
        if (posTrack== null && rotTrack == null) return null;

        const keys: any[] = [];
        const rate = 0.008; // サイズの調整
        for (let i = 0; i < posTrack.times.length; i++) {
            const key: any = {};

            // 時間
            key["time"] = parseInt(`${posTrack.times[i] * 1000}`);

            // 回転
            if (id == "rButtock" || id == "lButtock") {
                const id2 = id == "rButtock" ? "rThigh" : "lThigh";
                const q1 = this.values2quaternion(rotTrack.values, i);
                const rotTrack2 = this.findTrack(`${id2}.quaternion`, tracks);
                q1.multiply(this.values2quaternion(rotTrack2.values, i));
                key["rot"] = [-q1.x, q1.y, -q1.z, q1.w];
            } else {
                key["rot"] = [
                    -rotTrack.values[i * 4],
                    rotTrack.values[i * 4 + 1],
                    -rotTrack.values[i * 4 + 2],
                    rotTrack.values[i * 4 + 3],
                ];
            }

            // 位置 BVH 内に Hip 設定がある場合, pos が追加される
            if (id == "Hip") {
                key["pos"] = [
                    -posTrack.values[i * 3] * rate,
                    posTrack.values[i * 3 + 1] * rate,
                    -posTrack.values[i * 3 + 2] * rate,
                ];
            }

            keys.push(key);
        }
        if (keys.length == 0) return null;
        return keys;
    }

    // クリップの生成
    private createClip = (vrm: any, bvh: any) => {           
        console.log("vrm.humanoid", vrm.humanoid.humanBones);
        const bones = this.nameList.map((boneName) => {
            return vrm.humanoid.humanBones[boneName].node;
        });

        // AnimationClipの生成
        const hierarchy = [];
        for (let i = 0; i < this.idList.length; i++) {
            const keys = this.createKeys(i, this.idList[i], bvh.clip.tracks);
            if (keys != null) {
                hierarchy.push({ keys: keys });
            }
        }
        console.log("hierarchy", hierarchy);
        console.log("bones", bones);

        const clip = THREE.AnimationClip.parseAnimation(
            { hierarchy: hierarchy },
            bones
        );

        // トラック名の変更
        clip.tracks.some((track) => {
            track.name = track.name.replace(
            /^\.bones\[([^\]]+)\].(position|quaternion|scale)$/,
            "$1.$2"
            );
        });
        return clip;
    }

    public load(
        url: string,
        vrm: any,
        version: number,
        onLoad: (vrma: VRMA) => void,
        onProgress?: (event: ProgressEvent) => void,
        onError?: (event: ErrorEvent) => void,
    ): void {
        this.bvhLoader.load(url, (result: { clip: any; }) => {
            const animationClip = this.createClip(vrm, result);
            onLoad({ clip: animationClip });
        },
        onProgress,
        onError);
    }
}
