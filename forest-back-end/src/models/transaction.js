import {encode, sign} from '../transaction';
import {SECRET_KEY} from '../config';

"use strict";

export default class Transaction {
    constructor(app) {
        this.app = app;
        this.getPayments = this.getPayments.bind(this);
        this.getTransaction = this.getTransaction.bind(this);
    }

    async getPayments(publicKey) {
        let listPayments = await this.app.db.collection('transaction')
            .find({operation:'payment',tags:{$elemMatch:{key:'account',value:publicKey}}})
            .sort({time:-1}).toArray();
        return listPayments
    }

    async getTransaction(id){
        let res = await this.app.db.collection('transaction').findOne({_id:id});
        return res
    }

    async getTransactions(id, page=1, limit=2){
        let res = await this.app.db.collection('transaction')
                                .find({tags:{$elemMatch:{key:'account',value:id}}})
                                .sort({time:-1})
                                .skip(+(page-1)*limit).limit(+limit)
                                .toArray();
        return res
    }
}