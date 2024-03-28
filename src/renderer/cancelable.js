export default function createCancelable() {
    const set = new Set();

    function cancelable(promises, onCancel) {
        let resolve;
        const executor = r => set.add(resolve = () => r(onCancel?.()));
        const promise = new Promise(executor).then(() => true);
        return race(promise, ...promises).finally(() => set.delete(resolve));
    }

    function cancel() {
        const { size } = set;
        set.forEach(f => f());
        set.clear();
        return size;
    }

    return [cancelable, cancel];
}

async function race(...promises) {
    const indexPromises = promises.map(async (p, i) => [(await p), i]);
    const [result, index] = await Promise.race(indexPromises);
    return Array(promises.length).toSpliced(index, 1, result);
}
