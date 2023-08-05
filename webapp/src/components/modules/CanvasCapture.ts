/** Canvasを録画して動画ファイルを生成するクラス 
 * @class CanvasCapture
*/

import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'

export class CanvasCapture {
    private static _ffmpeg = new FFmpeg();
    private static baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.1/dist/umd';

    /* キャプチャーを開始する
        * @param {HTMLCanvasElement} canvas キャプチャー対象のCanvas
        * @param {number} captureTime キャプチャー時間(秒)
        * @return {Promise<string>} 生成した動画のURL
        * @memberof CanvasCapture
        * @method capture
        * @static
        * @public
        * @example
        * const canvas = document.getElementById("canvas") as HTMLCanvasElement;
        *  CanvasCapture.capture(canvas, 5).then((dataURL) => {
        *     console.log(dataURL);
        * });
        */
    public static capture = async (canvas: HTMLCanvasElement, captureTime: number): Promise<[string, string]> => {
        console.log('capture');
        // ffmpegの初期化
        // await this._ffmpeg.load({});
        
        await this._ffmpeg.load({
            coreURL: await toBlobURL(`${this.baseURL}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await toBlobURL(`${this.baseURL}/ffmpeg-core.wasm`, 'applicaiton/wasm')
        });
        
        console.log('_ffmpeg.load');

        return new Promise<[string, string]>((resolve, reject) => {
            
            // 生成した 動画のURLを返す
            const stream = canvas.captureStream();
            const recorder = new MediaRecorder(stream);
            const chunks: Blob[] = [];
            recorder.ondataavailable = function (e) {
                chunks.push(e.data);
            };
            recorder.onstop = function (e) {
                const blob = new Blob(chunks, { "type": "video/webm;codecs=vp9" });
                CanvasCapture.blobToDataURL(blob)
                    .then(async (dataURL) => {
                        // resolve(['capture.webm', dataURL]);
                        // console.log('dataURL', dataURL);
                        // webm -> mp4に変換
                        await CanvasCapture._ffmpeg.writeFile('capture.webm', await fetchFile(dataURL));
                        console.log('ffmpeg writeFile');
                        await CanvasCapture._ffmpeg.exec(['-i', 'capture.webm', 'capture.mp4']);
                        console.log('ffmpeg exec');
                        const data = await CanvasCapture._ffmpeg.readFile('capture.mp4');
                        console.log('ffmpeg readFile');
                        const mp4 = URL.createObjectURL(new Blob([(data as Uint8Array).buffer], { type: 'video/mp4' }));
                        console.log('ffmpeg mp4');
                        resolve(['capture.mp4', mp4]);
                    });
            };
            recorder.start();            
            setTimeout(() => {
                recorder.stop();
            }, captureTime * 1000);
        });
    }

    private static blobToDataURL(blob: Blob): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            const a = new FileReader();
            a.onload = (e) => {
                if (e == null || e.target == null) reject();
                resolve(e.target?.result as string);
            }
            a.readAsDataURL(blob);
        })
    }
}