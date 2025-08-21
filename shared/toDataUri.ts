export async function toDataUri(url: string) {
    const res = await fetch(url); // no custom headers
    const buf = Buffer.from(await res.arrayBuffer());
    return `data:image/jpeg;base64,${buf.toString('base64')}`;
}
