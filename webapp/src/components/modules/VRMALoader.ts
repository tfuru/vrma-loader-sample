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
    /* private bonesNameList = {
        'head':          ['root',       'head',          'head',            'head'],
        'neck':          ['neck_1',     'neck',          'neck',            'neck'],
        'chest':         ['torso_4',    'spine1',        'chest',           'spine1'],
        'spine':         ['torso_3',    'spine3',        'spine',           'spine2'],
        'hips':          ['torso_2',    'hips',          'hips',            'hips'],
        'rightShoulder': ['r_shoulder', 'rightshoulder', 'rightshoulder',   'shoulder_r'],
        'rightUpperArm': ['r_up_arm',   'rightarm',      'rightupperarm',   'arm_r'],
        'rightLowerArm': ['r_low_arm',  'rightforearm',  'rightlowerarm',   'forearm_r'],
        'rightHand':     ['r_hand',     'righthand',     'righthand',       'hand_r'],
        'leftShoulder':  ['l_shoulder', 'leftshoulder',  'leftshoulder',    'shoulder_l'],
        'leftUpperArm':  ['l_up_arm',   'leftarm',       'leftupperarm',    'arm_l'],
        'leftLowerArm':  ['l_low_arm',  'leftforearm',   'leftlowerarm',    'forearm_l'],
        'leftHand':      ['l_hand',     'lefthand',      'lefthand',        'hand_l'],
        'rightUpperLeg': ['r_up_leg',   'rightupleg',    'rightupperleg',   'upleg_r'],
        'rightLowerLeg': ['r_low_leg',  'rightleg',      'rightlowerleg',   'leg_r'],
        'rightFoot':     ['r_foot',     'rightfoot',     'rightfoot',       'foot_r'],
        'leftUpperLeg':  ['l_up_leg',   'leftupleg',     'leftupperleg',    'upleg_l'],
        'leftLowerLeg':  ['l_low_leg',  'leftleg',       'leftlowerleg',    'leg_l'],
        'leftFoot':      ['l_foot',     'leftfoot',      'leftfoot',        'foot_l'],
    }; */

    // ボーンリスト
    private bonesNameList = {
        'head':          ['root',       'head',          'head',            'J_Bip_C_Head',     'head',         'Normalized_J_Bip_C_Head',],
        'neck':          ['neck_1',     'neck',          'neck',            'J_Bip_C_Neck',     'neck',         'Normalized_J_Bip_C_Neck',],
        'chest':         ['torso_4',    'spine1',        'chest',           'J_Bip_C_Chest',    'spine1',       'Normalized_J_Bip_C_Chest',],
        'spine':         ['torso_3',    'spine3',        'spine',           'J_Bip_C_Spine',    'spine2',       'Normalized_J_Bip_C_Spine',],
        'hips':          ['torso_2',    'hips',          'hips',            'J_Bip_C_Hips',     'hips',         'Normalized_J_Bip_C_Hips',],
        'rightShoulder': ['r_shoulder', 'rightshoulder', 'rightshoulder',   'J_Bip_R_Shoulder', 'shoulder_r',   'Normalized_J_Bip_R_Shoulder',],
        'rightUpperArm': ['r_up_arm',   'rightarm',      'rightupperarm',   'J_Bip_R_UpperArm', 'arm_r',        'Normalized_J_Bip_R_UpperArm',],
        'rightLowerArm': ['r_low_arm',  'rightforearm',  'rightlowerarm',   'J_Bip_R_LowerArm', 'forearm_r',    'Normalized_J_Bip_R_LowerArm',],
        'rightHand':     ['r_hand',     'righthand',     'righthand',       'J_Bip_R_Hand',     'hand_r',       'Normalized_J_Bip_R_Hand',],
        'leftShoulder':  ['l_shoulder', 'leftshoulder',  'leftshoulder',    'J_Bip_L_Shoulder', 'shoulder_l',   'Normalized_J_Bip_L_Shoulder',],
        'leftUpperArm':  ['l_up_arm',   'leftarm',       'leftupperarm',    'J_Bip_L_UpperArm', 'arm_l',        'Normalized_J_Bip_L_UpperArm',],
        'leftLowerArm':  ['l_low_arm',  'leftforearm',   'leftlowerarm',    'J_Bip_L_LowerArm', 'forearm_l',    'Normalized_J_Bip_L_LowerArm',],
        'leftHand':      ['l_hand',     'lefthand',      'lefthand',        'J_Bip_L_Hand',     'hand_l',       'Normalized_J_Bip_L_Hand',],
        'rightUpperLeg': ['r_up_leg',   'rightupleg',    'rightupperleg',   'J_Bip_R_UpperLeg', 'upleg_r',      'Normalized_J_Bip_R_UpperLeg',],
        'rightLowerLeg': ['r_low_leg',  'rightleg',      'rightlowerleg',   'J_Bip_R_LowerLeg', 'leg_r',        'Normalized_J_Bip_R_LowerLeg',],
        'rightFoot':     ['r_foot',     'rightfoot',     'rightfoot',       'J_Bip_R_Foot',     'foot_r',       'Normalized_J_Bip_R_Foot',],
        'leftUpperLeg':  ['l_up_leg',   'leftupleg',     'leftupperleg',    'J_Bip_L_UpperLeg', 'upleg_l',      'Normalized_J_Bip_L_UpperLeg',],
        'leftLowerLeg':  ['l_low_leg',  'leftleg',       'leftlowerleg',    'J_Bip_L_LowerLeg', 'leg_l',        'Normalized_J_Bip_L_LowerLeg',],
        'leftFoot':      ['l_foot',     'leftfoot',      'leftfoot',        'J_Bip_L_Foot',     'foot_l',       'Normalized_J_Bip_L_Foot',],
    };

    public constructor(manager?: LoadingManager) {
        super(manager);
    }

    public load(
        url: string,
        vrm: any,
        version: number,
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
                console.log("tracks name", name);
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
                    keys = this.createKeys(version, i, id, animations.tracks);
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
    private createKeys = (version: number, i: number, id: string, tracks: any[]) => {
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
            /*
            // 回転
            key["rot"] = [
                -rotTrack.values[i * 4],
                rotTrack.values[i * 4 + 1],
                -rotTrack.values[i * 4 + 2],
                rotTrack.values[i * 4 + 3],
            ];

            // 位置
            if (id.toLowerCase() == "hip") {
                key["pos"] = [
                    -posTrack.values[i * 3] * rate,
                    posTrack.values[i * 3 + 1] * rate,
                    -posTrack.values[i * 3 + 2] * rate,
                ];
            }
            */
            if (version == 0) {
                // VRM 0.x
                // 回転
                key["rot"] = [
                    -rotTrack.values[i * 4],
                    rotTrack.values[i * 4 + 1],
                    -rotTrack.values[i * 4 + 2],
                    rotTrack.values[i * 4 + 3],
                ];

                // 位置
                if (id.toUpperCase() == "Hip".toUpperCase()) {
                    key["pos"] = [
                        -posTrack.values[i * 3] * rate,
                        posTrack.values[i * 3 + 1] * rate,
                        -posTrack.values[i * 3 + 2] * rate,
                    ];
                }
            } else {
                // VRM 1.0 https://vrm.dev/vrm1/changed#gltf-z-forward
                // 回転
                key["rot"] = [
                    rotTrack.values[i * 4],
                    rotTrack.values[i * 4 + 1],
                    rotTrack.values[i * 4 + 2],
                    rotTrack.values[i * 4 + 3],
                ];
                
                // 位置
                if (id.toUpperCase() == "Hip".toUpperCase()) {
                    if(posTrack == null) {
                        key["pos"] = [];
                    } else {
                        key["pos"] = [
                            posTrack.values[i * 3] * rate,
                            posTrack.values[i * 3 + 1] * rate,
                            posTrack.values[i * 3 + 2] * rate,
                        ];
                    }
                }                
            }           
            keys.push(key);
        }
        if (keys.length == 0) return null;
        return keys;
    }
}