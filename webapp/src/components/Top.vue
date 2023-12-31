<template>
    <div class="top">
        <h3>VRMA, BVHをアップロードして VRMを動かすやつ</h3>
        <p>mocopiで作成できるBVH(.bvh)やそのBVHをVRMA(.vrma)に変換したファイルを<br />アップロードするとVRMが動きます</p>     
        <div class="container">
            <label for="vrmfile">VRMファイル(.vrm)を選択してください</label>
            <input type="file" if="vrmfile" :onchange="onChangeVrmFile"/>
        </div>
        <div class="container">
            <label for="bvhvrmafile">BVHファイル(.bvh),VRMAファイル(.vrma)を選択</label>
            <input type="file" if="vrmafile" :onchange="onChangeBvhVrmaFile"/>
            <div>
                <p>サンプル <a href="./sample.bvh">BVHファイル</a> / <a href="./sample.vrma"> VRMAファイル</a></p>
            </div>        
        </div>
        <div class="container">
            <p>録画 ffmpeg.wasmを利用して webm を mp4 へ変換するので<br />変換に数分かかる場合があります</p>
            <div>
                <input id="valuecapturetime" type="number" min="1" max="60" step="1" :value="captureTime" @input="onInputCaptureTime" />
                <input type="button" :onclick="onCapture" :value="`秒 録画する`"/>
                <p id="capturestatustext">{{captureStatusText}}</p>
            </div>
        </div>

        <div id="viewer"></div>
        <div>
            <h3>参考サイト</h3>
            <p><a href="https://vrm-c.github.io/bvh2vrma/" target="_blank">bvh2vrma</a></p>
            <p>BVHファイルをVRMAnimationに変換するサイト</p>
            <p><a href="https://github.com/malaybaku/AnimationClipToVrmaSample" target="_blank">AnimationClipToVrmaSample</a></p>
            <p><a href="https://twitter.com/baku_dreameater">@baku_dreameater</a> さん作の<br>ヒューマノイドのモーションからなるAnimation Clipを VRM Animation (.vrma) に変換するプロジェクト</p>            
            <p><a href="https://github.com/tfuru/vrma-loader-sample" target="_blank">vrma-loader-sample</a></p>
            <p>このサイトのソースコードなど一式</p>
        </div>      
    </div>
</template>
  
<script lang="ts">
import { defineComponent, onMounted, ref } from 'vue';

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { BVHLoader } from 'three/examples/jsm/loaders/BVHLoader.js'
import { VRMLoaderPlugin } from '@pixiv/three-vrm';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

import { VRMALoader } from './modules/VRMALoader'
import { CanvasCapture } from './modules/CanvasCapture'


export default defineComponent({
    name: 'TopComponent',
    setup() {
        const renderer = new THREE.WebGLRenderer();
        const scene = new THREE.Scene();
        let _camera: THREE.PerspectiveCamera | null = null;
        const loader = new GLTFLoader();
        const bvhLoader = new BVHLoader();
        const vrmaLoader = new VRMALoader();

        let _vrm: any = null;
        let _mixer: THREE.AnimationMixer | null = null;
        const vrmFilePath = './po03.vrm';

        // キャプチャ時間(秒)
        let captureTime = 15;
        const captureStatusText = ref("")

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
            _camera.position.set(0, 1, -1)
            _camera.rotation.set(0, Math.PI, 0)
            
            const controls = new OrbitControls(_camera, canvas);
            controls.target.y = 1.0;
            controls.update();

            const light = new THREE.DirectionalLight(0xffffff)
            light.position.set(-1, 1, -1).normalize()
            scene.add(light)
            render();

            // VRM ファイルを読み込む
            loadVrmFile(vrmFilePath);
        };
        
        // VRM ファイルを読み込む
        const loadVrmFile = (vrmFilePath: string) => {
            // シーンから VRMを削除
            if (_vrm != null) {
                scene.remove(_vrm.scene);
            }
            
            // VRM ファイルを読み込む
            loader.load(
                vrmFilePath,
                (gltf: { userData: { vrm: any; }; }) => {
                    _vrm = gltf.userData.vrm;
                    scene.add(_vrm.scene);
                    render();
                },
                (progress: { loaded: number; total: number; }) => console.log('Loading model...', 100.0 * (progress.loaded / progress.total), '%'),
                (error: any) => console.error(error),
            );
        }

        const onChangeBvhFile = (e: any) => {
            const file = e.target.files[0];
            const blob = new Blob([file], { type: "application/octet-stream" });
            const url = URL.createObjectURL(blob);

            // BVHファイルの読み込み
            bvhLoader.load(url, (result: { clip: any; }) => {
                _mixer = new THREE.AnimationMixer(_vrm.scene);                        
                const animationClip = createClip(_vrm, result);
                const action = _mixer.clipAction(animationClip);
                action.play();
            });
        }

        // VRMAファイルの読み込み
        const onChangeVrmaFile = (e: any) => {
            const file = e.target.files[0];
            const blob = new Blob([file], { type: "application/octet-stream" });
            const url = URL.createObjectURL(blob);

            // VRMAファイルの読み込み
            vrmaLoader.load(url, _vrm, (result: { clip: THREE.AnimationClip; }) => {
                _mixer = new THREE.AnimationMixer(_vrm.scene);               
                const action = _mixer.clipAction(result.clip);
                action.play();
            });
        }
        
        // VRM ファイルの読み込み
        const onChangeVrmFile = (e: any) => {
            const file = e.target.files[0];
            const blob = new Blob([file], { type: "application/octet-stream" });
            const url = URL.createObjectURL(blob);
            
            loadVrmFile(url);
        }

        // bvh,vrma ファイルの読み込み
        const onChangeBvhVrmaFile = (e: any) => {
            const file = e.target.files[0];
            const fileName = file.name.toLowerCase();
            if (fileName.endsWith(".bvh")) {
                onChangeBvhFile(e);
            } else if (fileName.endsWith(".vrma")) {
                onChangeVrmaFile(e);
            }
        }
        
        const onInputCaptureTime = (e: any) => {
            captureTime = parseInt(e.target.value);
            console.log("onInputCaptureTime", captureTime);
        }

        // キャンバスを録画する
        const onCapture = (e: any) => {
            var progress = function (type: string, message: string, v: number) {
                let text = "";
                switch(type){
                    case "onstart":
                        text = `録画開始 ${captureTime}秒後に終了`;
                        break;
                    case "onstop":
                        text = "録画終了";
                        break;
                    case "progress":
                        text = `webm -> mp4 変換中 ${message}`;
                        break;
                }
                captureStatusText.value = text;
            }
            CanvasCapture.capture(renderer.domElement, captureTime, progress).then(([fileName, dataUrl]) => {
                    const a = document.createElement("a");
                    a.href = dataUrl;
                    a.download = fileName;
                    a.click();

                    // 3秒ごにステータステキストを消す
                    setTimeout(() => {
                        captureStatusText.value = "";
                    }, 3000);
                })
                .catch((error: any) => {
                    console.error(error);
                });
        }

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

        // mocopi BVHのボーンリスト
        // https://www.sony.net/Products/mocopi-dev/jp/documents/Home/TechSpec.html
        // Unity Humanoid Avatar
        // https://wiki.virtualcast.jp/wiki/unity/humanoid

        const idList = [
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

        // クリップの生成
        const createClip = (vrm: any, bvh: any) => {           
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

        return {
            onChangeBvhFile,
            onChangeVrmaFile,
            onChangeVrmFile,
            onCapture,
            onChangeBvhVrmaFile,
            captureTime,
            captureStatusText,
            onInputCaptureTime
        };
    }
});
</script>
  
<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
#top {
    width: 100%;
}

.container {
    margin: 0 auto;
    width: 350px;
    /* height: 60px; */
    padding: 5px 0px;

    text-align: left;

    p {
        margin: 0;
    }

    input {
        font-size: medium;
    }
}

label {
    display: block;
}

#viewer {
    margin: 0 auto;
    width: 350px;
    height: 600px;

    canvas {
        margin: 0 auto;
    }
}

#valuecapturetime {
    float: left;
    margin-right: 10px;
}

#capturestatustext {
    color: red;
}

</style>
  