const onCancelList = new Set();

export default function cancelable(promise) {
    let cancelHandler;
    const resultPromise = promise.then(result => [false, result]);
    const cancelPromise = new Promise(resolve => {
        cancelHandler = () => resolve([true]);
        onCancelList.add(cancelHandler);
    });
    return Promise
        .race([resultPromise, cancelPromise])
        .finally(() => onCancelList.delete(cancelHandler));
}

export const cancelList = () => {
    const { size } = onCancelList;
    onCancelList.forEach(f => f());
    onCancelList.clear();
    return size;
};
