
export default function confirmAction(query) {
    return new Promise((resolve, reject) => {
        const output = window.confirm(query);
        // shit idk, think I would need to use context.consumer/provider
        // everywhere I want to use this function, and that just about renders
        // it useless man
        if (output === true || output === false) {
            return resolve(output);
        } else {
            return reject('Error handling confirmAction');
        }
    });
}
