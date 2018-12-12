import {encode, sign} from '../transaction';
import {SECRET_KEY} from '../config';

export default class Payment {
    constructor(app) {
        this.app = app;
        this.makePayment = this.makePayment.bind(this);
    }

    makePayment(sender, receiver) {
        let tx = {
            version: 1,
            account: '',
            sequence: 7,
            memo: Buffer.alloc(0),
            operation: 'payment',
            params: {address: receiver, amount: 1},
            signature: Buffer.alloc(64, 0)
        }

        sign(tx, sender)
        let data_encoding = '0x'+encode(tx).toString('hex');

        return new Promise((resolve, reject) => {
            this.app.service.get(`broadcast_tx_commit?tx=${data_encoding}`).then(res => {
                console.log(res.data);
                return resolve(res.data)
            }).catch(err => {
                return reject(err);
            });
        });
    }
}