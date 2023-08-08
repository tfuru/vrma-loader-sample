import { AnimationClip, Loader, LoadingManager } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

export interface VRMA {
    clip: AnimationClip;
}

export class VRMALoader extends Loader {
    private _loader = new GLTFLoader();

    // ボーンリストの生成
    private bonesNameList = [
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
        'torso_4',
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

    public constructor(manager?: LoadingManager) {
        super(manager);
    }

    public load(
        url: string,
        vrm: any,
        onLoad: (vrma: VRMA) => void,
        onProgress?: (event: ProgressEvent) => void,
        onError?: (event: ErrorEvent) => void,
    ): void {
        // console.log("vrm", vrm);
        const loader = new GLTFLoader(); 
        loader.load(url, (gltf) => {
            // console.log("gltf", gltf);
            
            const animations = gltf.animations[0];
            console.log("animations", animations);

            // ボーンリストの生成 vrm の humanBones から取得する
            const bones = this.bonesNameList.map((boneName) => {
                return vrm.humanoid.humanBones[boneName].node;
            });
            console.log("bones", bones);

            // ここでボーンの階層構造を生成する
            const hierarchy: any[] = [];
            for (let i = 0; i < this.idList.length; i++) {
                const keys = this.createKeys(i, this.idList[i], animations.tracks);
                if (keys != null) {
                    hierarchy.push({ keys: keys });
                }
            }
            // console.log("hierarchy", hierarchy);

            const clip = AnimationClip.parseAnimation(
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
            console.log("clip", clip);

            onLoad({ clip: clip });
        }, 
        onProgress,
        onError);
    }

    public loadAsync(url: string, vrm: any, onProgress?: (event: ProgressEvent) => void): Promise<VRMA> {
        return new Promise<VRMA>((resolve, reject) => { 
            const loader = new GLTFLoader();
            loader.loadAsync(url, onProgress)
                .then((gltf) => {
                    // TODO: gltf内容を見て clip, skeleton を取得する
                    /*
                    const clip = gltf.animations[0];
                    const skeleton = gltf.scene.children[0].children[0].children[0].children[0].children[0].children[0].children[0].children[0].skeleton;
                    resolve({ clip, skeleton });
                    */
                }).catch((error) => {
                    reject(error);
                });
        });
    }

    // トラックの取得
    private findTrack = (name: string, tracks: any[]) => {
        for (let i = 0; i < tracks.length; i++) {
            if (tracks[i].name == name) return tracks[i];
        }
        return null;
    }

    // キーリストの生成
    private createKeys = (i: number, id: string, tracks: any[]) => {
        const posTrack = this.findTrack(`${id}.position`, tracks);
        const rotTrack = this.findTrack(`${id}.quaternion`, tracks);
        console.log(" posTrack", id, posTrack);
        console.log(" rotTrack", id, rotTrack);
        if (posTrack== null && rotTrack == null) return null;

        let times = posTrack?.times;
        if (times == null) times = rotTrack?.times;
        if (times == null) return null;

        const keys: any[] = [];
        const rate = 0.008; // サイズの調整
        for (let i = 0; i < times.length; i++) {
            const key: any = {};

            // 時間
            key["time"] = parseInt(`${times[i] * 1000}`);

            // 回転
            key["rot"] = [
                -rotTrack.values[i * 4],
                rotTrack.values[i * 4 + 1],
                -rotTrack.values[i * 4 + 2],
                rotTrack.values[i * 4 + 3],
            ];

            // 位置
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
}