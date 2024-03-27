const cancelType = new Map();

export function cancelable(type, promise, onCancel) {
    let cancelHandler;
    const resultPromise = promise.then(result => [false, result]);
    const cancelPromise = new Promise(resolve => {
        cancelHandler = () => { resolve([true]); onCancel?.(); };
        cancelType.set(cancelHandler, type);
    });
    return Promise
        .race([resultPromise, cancelPromise])
        .finally(() => cancelType.delete(cancelHandler));
}

export function cancelList(targetType) {
    const entries = Array.from(cancelType.entries());
    const targets = entries.filter(([, type]) => type === targetType);
    targets.forEach(([cancel]) => {
        cancel?.();
        cancelType.delete(cancel);
    });
    return targets.length;
}
