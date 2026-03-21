interface ParsedData {
  max: number;
  peaks: number[];
}

async function calculate(data: ArrayBuffer): Promise<ParsedData> {
  const audioCtx = new OfflineAudioContext(2, 1, 44100);
  const buffer = await audioCtx.decodeAudioData(data);
  const leftData = buffer.getChannelData(0);
  const rightData = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : leftData;

  const length = leftData.length;
  const chunkSize = Math.ceil(length / 100);
  const peaks: number[] = [];

  for (let i = 0; i < length; i += chunkSize) {
    let sum = 0;
    const end = Math.min(i + chunkSize, length);
    for (let j = i; j < end; j++) {
      sum += (Math.abs(leftData[j]!) + Math.abs(rightData[j]!)) / 2;
    }
    peaks.push(sum / (end - i));
  }

  let max = 0;
  for (const p of peaks) {
    if (p > max) max = p;
  }

  return { max, peaks };
}

self.addEventListener("message", (e: MessageEvent<ArrayBuffer>) => {
  calculate(e.data)
    .then((result) => {
      self.postMessage(result);
    })
    .catch((err) => {
      self.postMessage({ max: 0, peaks: [], error: String(err) });
    });
});
