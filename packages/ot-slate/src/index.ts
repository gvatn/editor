import * as json1 from 'ot-json1';

const json1Type = json1.type;

const type = {
    name: 'ot-slate',
    uri: 'https://github.com/gvatn/ot-slate',

    create(initial) {
        console.log("Create", initial);
        return json1Type.create(initial);
    },

    apply(snapshot, op) {
        console.log("Applying", snapshot, op);
        return json1Type.apply(snapshot, op);
    },

    transform(op1, op2, side) {
        console.log("Transform", op1, op2, side);
        return json1Type.transform(op1, op2, side);
    },

    compose(op1, op2) {
        console.log("Compose", op1, op2);
        return json1Type.compose(op1, op2);
    },

    normalize(op) {
        console.log("Normalize", op);
        return json1Type.normalize(op);
    },


};

export {
    type,
    json1
}