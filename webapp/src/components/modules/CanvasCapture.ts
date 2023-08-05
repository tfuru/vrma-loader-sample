/** Canvasを録画して動画ファイルを生成するクラス 
 * @class CanvasCapture
*/
export class CanvasCapture {
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
    public static capture = (canvas: HTMLCanvasElement, captureTime: number): Promise<[string, string]> => {
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
                    .then((dataURL) => {
                        resolve(['capture.webm', dataURL]);
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