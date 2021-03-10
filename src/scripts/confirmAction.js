
export default function confirmAction(query) {
    return new Promise((resolve, reject) => {
        const output = window.confirm(query);
        if (output === true || output === false) {
            return resolve(output);
        } else {
            return reject('Error handling confirmAction');
        }
    });
}
