const cancelType = new Map();

export async function cancelable(type, promise, onCancel) {
    let cancelHandler;
    try {
        return await race(new Promise(cancelExecutor), promise);
    } finally {
        cancelType.delete(cancelHandler);
    }

    function cancelExecutor(resolve) {
        cancelHandler = () => { resolve(true); onCancel?.(); };
        cancelType.set(cancelHandler, type);
    }
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

export async function race(...promises) {
    const indexPromises = promises.map(async (p, i) => [(await p), i]);
    const [result, index] = await Promise.race(indexPromises);
    return Array(promises.length).toSpliced(index, 1, result);
}
