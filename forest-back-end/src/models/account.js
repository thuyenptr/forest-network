const {Keypair} = require('stellar-base');
const moment = require('moment');
import {encode,sign} from '../transaction';
import {SECRET_KEY,ThongAccount} from '../config';
import _ from 'lodash';
import { Buffer } from 'safe-buffer';


const BANDWIDTH_PERIOD = 86400;
const ACCOUNT_KEY = Buffer.from('account');
const OBJECT_KEY = Buffer.from('object');
const MAX_BLOCK_SIZE = 22020096;
const RESERVE_RATIO = 1;
const MAX_CELLULOSE = Number.MAX_SAFE_INTEGER;
const NETWORK_BANDWIDTH = RESERVE_RATIO * MAX_BLOCK_SIZE * BANDWIDTH_PERIOD;

export default class Account {
    constructor(app) {
        this.app = app;
        this.UserSayHello = this.UserSayHello.bind(this);
        this.createAccount = this.createAccount.bind(this);
        this.getTransaction = this.getTransaction.bind(this);
        this.getAmount = this.getAmount.bind(this);
    }


    UserSayHello() {
        return new Promise((resolve, reject) => {
            resolve("Hello from User Model");
        })
    }

    async auth(publicKey) {
       let account = await this.app.db.collection('account').findOne({_id: publicKey});
       return account;
    }

    async createAccount(publicKey) {
        let account = await this.app.db.collection('account').findOne({_id: publicKey});

        let tx = {
            version: 1,
            account: '',
            sequence: account.sequence + 1,
            memo: Buffer.alloc(0),
            operation: 'create_account',
            params: {address: publicKey},
        }

        sign(tx, SECRET_KEY);
        let data_encoding = '0x'+encode(tx).toString('hex');

        return new Promise((resolve, reject) => {
            this.app.service.get(`broadcast_tx_commit?tx=${data_encoding}`).then(res => {
                console.log(res)
                if (_.get(res.data.result, "height") === "0") {
                    let rs = {code: -1}
                    return resolve(rs);
                } else {
                    return resolve(res.data)
                }
            }).catch(err => {
                return reject(err);
            });
        });
    }

    async getTransaction(publicKey) {
        let transaction = [];
        let total_count = 0;

        await this.app.service.get(`tx_search?query="account='${publicKey}'"&prove=false&page=1&per_page=100`).then(res => {
            transaction = res.data.result.txs;
            total_count = res.data.result.total_count;
        }).catch(err => {
            console.log(err);
        });

        let bound = Math.ceil(total_count / 100);
        for (let i = 2; i <= bound; ++i) {
            await this.app.service.get(`tx_search?query="account='${publicKey}'"&prove=false&page=${i}&per_page=100`).then(res => {
                transaction = transaction.concat(res.data.result.txs);
            }).catch(err => {
                console.log(err);
            });
        }
        return transaction;
    }

    async getAmount(publicKey) {
        let amount = 0;
        await this.getTransaction(publicKey).then(rs => {
            for (let i = 0; i < rs.length; ++i) {
                let data = this.app.helper.decodeTransaction(_.get(rs[i], "tx"));
                if (_.get(data, "operation") === "payment")
                if (_.get(data, "account") === publicKey) { // chuyen tien di cho address
                    amount -= parseInt(_.get(data.params, "amount"));
                } else {
                    amount += parseInt(_.get(data.params, "amount"));
                }
            }
        });
        return amount;
    }

    async getSequence(publicKey) {
        let account = await this.app.db.collection('account').findOne({_id: publicKey});
        return account.sequence;
    }


    async syncTxsToDB() {
        await this.app.service.get('status').then(async res => {
            let height = res.data.result.sync_info.latest_block_height;
            console.log(height);
            //Duyệt từng height
            for (let i = 1; i <= height; ++i) {
                    await this.app.service.get(`block?height=${i}`).then(res => {
                    let txs = res.data.result.block.data.txs;
                    let block_time = res.data.result.block.header.time;
                    if (txs !== null) {
                        //Duyệt từng tx trong list tx của block
                        txs.foreach(async tx => {
                            try {
                                await this.executeTx(tx,block_time);
                            } catch (err) {
                                console.log(err)
                            }
                        })
                    }
                }).catch(err =>{
                })
            }
        }).catch(err =>{
        })
    }

    async executeTx(tx,block_time)
    {
        //Verify tx có hợp lệ không, theo các trường hợp trong code server.js
        // Check signature
        if (!this.app.helper.verifyTransaction(tx))
        {
            throw Error('Wrong signature');
        }

        const data = this.app.helper.decodeTransaction(tx)//decode từ buffer binary sang json
        const txSize = tx.length;

        //Get account from MongoDB
        const account = await this.app.db.collection('account').findOne({_id: data.account});

        // Check account
        if (!account) {
            throw Error('Account does not exists');
        }

        // Check sequence
        const nextSequence = account.sequence + 1;
        if (!nextSequence.equals(data.sequence)) {
            throw Error('Sequence mismatch');
        }

        // Check memo
        if (data.memo.length > 32) {
            throw Error('Memo has more than 32 bytes.');
        }

        //Check bandwidth
        const diff = account.bandwidthTime
            ? moment(block_time).unix() - moment(account.bandwidthTime).unix()
            : BANDWIDTH_PERIOD;
        const bandwidthLimit = account.balance / MAX_CELLULOSE * NETWORK_BANDWIDTH;
        // 24 hours window max 65kB
        account.bandwidth = Math.ceil(Math.max(0, (BANDWIDTH_PERIOD - diff) / BANDWIDTH_PERIOD) * account.bandwidth + txSize);
        if (account.bandwidth > bandwidthLimit) {
            throw Error('Bandwidth limit exceeded');
        }

        //Process operation
        let operation = _.get(data, "operation");
        switch (operation) {
            case 'create_account': {
                let params = _.get(data, "params")
                let address = _.get(params, "address");
                const found = await this.app.db.collection('account').findOne({_id: address});

                if (found) {
                    throw Error('Account address existed');
                }

                const newAccount = {
                    _id: address,
                    sequence: 0,
                    balance: 0,
                    bandwidth: 0,
                }
                this.app.db.collection('account').insertOne(newAccount);
            }
                break;
            case 'payment': {
                let params = _.get(data, "params")
                let address = _.get(params, "address");
                let amount = _.get(params, "amount");

                const found = await this.app.db.collection('account').findOne({_id: address});
                if (!found) {
                    throw Error('Destination address does not exist');
                }
                if (address === data.account) {
                    throw Error('Cannot transfer to the same address');
                }
                if (amount <= 0) {
                    throw Error('Amount must be greater than 0');
                }
                if (new Decimal(amount).gt(account.balance)) {
                    throw Error('Amount must be less or equal to source balance');
                }

                //tru nguoi gui
                await this.app.db.collection('account').findOneAndUpdate(
                    {_id: account},
                    {
                        $set: {
                            sequence: nextSequence,
                            bandwidth: account.bandwidth,
                            bandwidthTime: block_time,
                        },
                        $inc: {balance: -amount},
                    })
                //cong nguoi nhan
                await this.app.db.collection('account').findOneAndUpdate(
                    {_id: address},
                    {$inc: {balance: amount}})

                console.log(`${account.address} transfered ${amount} to ${address}`);

            }
                break;
            case 'post': {
                let params = _.get(data, "params")
                let content = _.get(params, "content");
                let keys = _.get(params, "keys");
            }
                break;
            case 'update_account': {
                let params = _.get(data, "params")
                let key = _.get(params, "key");
                let value = _.get(params, "value");
            }
                break;
            case 'interact': {
                let params = _.get(data, "params")
                let object = _.get(params, "object");
                let content = _.get(params, "content");
            }
                break;
            default:
                throw Error('Operation is not support.');
        }
}