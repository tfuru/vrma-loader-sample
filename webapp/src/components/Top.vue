<template>
    <div class="top">
        <div id="viewer"></div>
    </div>
</template>
  
<script lang="ts">
import { defineComponent, onMounted } from 'vue';

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { BVHLoader } from 'three/examples/jsm/loaders/BVHLoader.js'
import { VRMLoaderPlugin } from '@pixiv/three-vrm';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

export default defineComponent({
    name: 'TopComponent',
    setup() {
        const renderer = new THREE.WebGLRenderer();
        const scene = new THREE.Scene();
        let _camera: THREE.PerspectiveCamera | null = null;
        const loader = new GLTFLoader();
        const bvhLoader = new BVHLoader();

        let _mixer: THREE.AnimationMixer | null = null;
        const vrmFilePath = './po03.vrm';
        const bvhFilePath = './Super_Yuppers_Motions.bvh';

        loader.register((parser: any) => {
            return new VRMLoaderPlugin(parser);
        });

        const render = () => {
            if (_camera == null) return;
            renderer.render(scene, _camera);
        }

        const initView = () => {
            const viewerElement = document.getElementById("viewer");
            if (viewerElement == null) return;
            console.log('initView', viewerElement);

            renderer.setPixelRatio(window.devicePixelRatio);
            renderer.setSize(viewerElement.clientWidth, viewerElement.clientHeight);
            renderer.setClearColor(0x7fbfff, 1.0);
            viewerElement.appendChild(renderer.domElement);
            const canvas = renderer.domElement;

            _camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 1000)
            _camera.position.set(0, 1.3, -3)
            _camera.rotation.set(0, Math.PI, 0)
            
            const controls = new OrbitControls(_camera, canvas);
            controls.target.y = 1.0;
            controls.update();

            const light = new THREE.DirectionalLight(0xffffff)
            light.position.set(-1, 1, -1).normalize()
            scene.add(light)
            render();

            loader.load(vrmFilePath,
                (gltf: { userData: { vrm: any; }; }) => {
                    const vrm = gltf.userData.vrm;
                    scene.add(vrm.scene);
                    console.log(vrm);
                    
                    // BVHファイルの読み込み
                    bvhLoader.load(bvhFilePath, (result: { clip: any; }) => {
                        _mixer = new THREE.AnimationMixer(vrm.scene);                        
                        const animationClip = createClip(vrm, result);
                        const action = _mixer.clipAction(animationClip);
                        action.play();
                    });

                    render();
                },
                (progress: { loaded: number; total: number; }) => console.log('Loading model...', 100.0 * (progress.loaded / progress.total), '%'),
                (error: any) => console.error(error),
            );      
        };

        // 参考コード https://note.com/npaka/n/ne34d7b70743c

        // トラックの取得
        const findTrack = (name: string, tracks: any[]) => {
            for (let i = 0; i < tracks.length; i++) {
                if (tracks[i].name == name) return tracks[i];
            }
            return null;
        }

        // 配列をQuaternionに変換
        const values2quaternion = (values: any[], i: number) => {
            return new THREE.Quaternion(
                values[i * 4],
                values[i * 4 + 1],
                values[i * 4 + 2],
                values[i * 4 + 3]
            );
        }

        // キーリストの生成
        const createKeys = (i: number, id: string, tracks: any[]) => {
            const posTrack = findTrack(`${id}.position`, tracks);
            const rotTrack = findTrack(`${id}.quaternion`, tracks);
            console.log("createKeys", id, posTrack, rotTrack);
            if (posTrack== null || rotTrack == null) return null;

            const keys: any[] = [];
            const rate = 0.008; // サイズの調整
            for (let i = 0; i < posTrack.times.length; i++) {
                const key: any = {};

                // 時間
                key["time"] = parseInt(`${posTrack.times[i] * 1000}`);

                // 回転
                if (id == "rButtock" || id == "lButtock") {
                const id2 = id == "rButtock" ? "rThigh" : "lThigh";
                let q1 = values2quaternion(rotTrack.values, i);
                const rotTrack2 = findTrack(`${id2}.quaternion`, tracks);
                q1.multiply(values2quaternion(rotTrack2.values, i));
                key["rot"] = [-q1.x, q1.y, -q1.z, q1.w];
                } else {
                key["rot"] = [
                    -rotTrack.values[i * 4],
                    rotTrack.values[i * 4 + 1],
                    -rotTrack.values[i * 4 + 2],
                    rotTrack.values[i * 4 + 3],
                ];
                }

                // 位置
                if (id == "hip") {
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
        const createClip = (vrm: any, bvh: any) => {
            // ボーンリストの生成
            const nameList = [
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
            const idList = [
                'Head',
                'Neck',
                'Chest',
                'Spine',
                'Hips',
                'RightShoulder',
                'RightUpperArm',
                'RightLowerArm',
                'RightHand',
                'LeftShoulder',
                'LeftUpperArm',
                'LeftLowerArm',
                'LeftHand',
                'RightUpperLeg',
                'RightLowerLeg',
                'RightFoot',
                'LeftUpperLeg',
                'LeftLowerLeg',
                'LeftFoot',
            ];            
           
            console.log("vrm.humanoid", vrm.humanoid.humanBones);
            const bones = nameList.map((boneName) => {
                return vrm.humanoid.humanBones[boneName].node;
            });

            // AnimationClipの生成
            const hierarchy = [];
            for (let i = 0; i < idList.length; i++) {
                const keys = createKeys(i, idList[i], bvh.clip.tracks);
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


        //フレーム更新
        let lastTime = new Date().getTime();
        const update = () => {
            requestAnimationFrame(update);

            // ミキサーを更新してアニメーションを進める
            if (_mixer) {
                let time = new Date().getTime();
                _mixer.update(time - lastTime);
                lastTime = time;
            }

            render();
        }
        update();

        onMounted(() => {
            initView();
        });

        return {};
    }
});
</script>
  
<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
#top {
    width: 100%;
}

#viewer {
    margin: 0 auto;
    width: 600px;
    height: 600px;

    canvas {
        margin: 0 auto;
    }
}
</style>
  