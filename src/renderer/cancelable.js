const cancelType = new Map();

export function cancelable(type, promise) {
    let cancelHandler;
    const resultPromise = promise.then(result => [false, result]);
    const cancelPromise = new Promise(resolve => {
        cancelHandler = () => resolve([true]);
        cancelType.set(cancelHandler, type);
    });
    return Promise
        .race([resultPromise, cancelPromise])
        .finally(() => cancelType.delete(cancelHandler));
}

export function cancelList(targetType) {
    const entries = cancelType.entries();
    const { length } = entries;
    for (let [cancel, type] of entries) {
        if (type === targetType) {
            cancel?.();
            cancelType.delete(cancel);
        }
    }
    return length;
}
