import { AnimationClip, Loader, LoadingManager } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

export interface VRMA {
    clip: AnimationClip;
}

export class VRMALoader extends Loader {
    private _loader = new GLTFLoader();

    // ボーンリスト
    // Unity Humanoid Avatar
    // https://wiki.virtualcast.jp/wiki/unity/humanoid

    // mocopi BVHのボーンリスト
    // https://www.sony.net/Products/mocopi-dev/jp/documents/Home/TechSpec.html

    // MotionBuilder のボーン定義
    // https://help.autodesk.com/view/MOBPRO/2023/JPN/?guid=GUID-6FD84BDA-2936-4142-B547-B2205EA0306E

    private bonesNameList = {
        'head':          ['root',       'head',          'head'],
        'neck':          ['neck_1',     'neck',          'neck'],
        'chest':         ['torso_4',    'spine1',        'chest'],
        'spine':         ['torso_3',    'spine3',        'spine'],
        'hips':          ['torso_2',    'hips',          'hips'],
        'rightShoulder': ['r_shoulder', 'rightshoulder', 'rightshoulder'],
        'rightUpperArm': ['r_up_arm',   'rightarm',      'rightupperarm'],
        'rightLowerArm': ['r_low_arm',  'rightforearm',  'rightlowerarm'],
        'rightHand':     ['r_hand',     'righthand',     'righthand'],
        'leftShoulder':  ['l_shoulder', 'leftshoulder',  'leftshoulder'],
        'leftUpperArm':  ['l_up_arm',   'leftarm',       'leftupperarm'],
        'leftLowerArm':  ['l_low_arm',  'leftforearm',   'leftlowerarm'],
        'leftHand':      ['l_hand',     'lefthand',      'lefthand'],
        'rightUpperLeg': ['r_up_leg',   'rightupleg',    'rightupperleg'],
        'rightLowerLeg': ['r_low_leg',  'rightleg',      'rightlowerleg'],
        'rightFoot':     ['r_foot',     'rightfoot',     'rightfoot'],
        'leftUpperLeg':  ['l_up_leg',   'leftupleg',     'leftupperleg'],
        'leftLowerLeg':  ['l_low_leg',  'leftleg',       'leftlowerleg'],
        'leftFoot':      ['l_foot',     'leftfoot',      'leftfoot'],
    };

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

            // VRMA 内のトラックに含まれるボーン名を取得する
            animations.tracks.forEach((track: any) => {
                const name = track.name.toLowerCase().replace(/\.(position|quaternion|scale)$/,"");
                console.log("name", name);
            });

            // ボーンリストの生成 vrm の humanBones から取得する?
            // const bonesNameList = gltf.userData.gltfExtensions.VRMC_vrm_animation.humanoid.humanBones;
            // console.log("bonesNameList", bonesNameList);
            const bones = Object.keys(this.bonesNameList).map((key) => {
                // console.log("key", key, vrm.humanoid.humanBones[key]);
                if (key in vrm.humanoid.humanBones){
                    return vrm.humanoid.humanBones[key].node;
                }
                return false;
            });
            console.log("bones", bones);

            // ここでボーンの階層構造を生成する
            const hierarchy: any[] = [];
            Object.keys(this.bonesNameList).forEach((key, i) => {
                const idList = (this.bonesNameList as any)[key];
                let keys = null;
                for (const id of idList) {
                    keys = this.createKeys(i, id, animations.tracks);
                    if (keys != null) break;
                }
                if (keys == null) return false;
                hierarchy.push({ keys: keys });
            });
            console.log("hierarchy", hierarchy);

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
            if (tracks[i].name.toLowerCase() == name.toLowerCase()) return tracks[i];
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