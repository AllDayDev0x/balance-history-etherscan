import axios from "axios";
import Web3 from "web3";
// import Blocks from "eth-block-timestamp"
import { Alchemy_key, EtherScan_API_KEY, rpc } from "./config"
const ETERHSCAN_API_KEY = EtherScan_API_KEY;
const DatesOfMonth = [0, 31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const web3 = new Web3(rpc.https);
// const blocks = new Blocks(`https://eth-mainnet.g.alchemy.com/v2/p-VZES0wzSmvJrry2na_4Qk9eoDFbrfL`);
/* get closest blockNumber from timeStamp */

export const getBlockNumber = async (timeStamp) => {
    // let {block} =await blocks.getDate(timeStamp);
    // console.log(block,"block")
    // return block;
    let result = await axios.get(`https://api.etherscan.io/api?module=block&action=getblocknobytime&timestamp=${timeStamp}&closest=before&apikey=${ETERHSCAN_API_KEY}`);
    return result.data.result;
}

/* get timeStamp of Blockchain at 1st day of month  */
export const getTimeStamp = (year, month, day) => {
    const date = new Date(`${year}-${month}-${day}`);
    return parseInt(date.getTime() / 1000);
}

/* get normal transaction list of address between start block and end block. */
export const getTxList = async (walletAddr, firstBlock, lastBlock) => {
    return await axios.get(`https://api.etherscan.io/api?module=account&action=txlist&address=${walletAddr}&sort=asc&apikey=B317BGY7FU3Y2NMM9NNF2T4BJHMI795QRF&startblock=${firstBlock}&endblock=${lastBlock}`)
        .then(res => {
            return res.data.result;
        })
        .catch(e => console.log(e))

}

/* get Date from blockchain's timestamp */
export const getDateFromTimeStamp = async (time) => {
    const date = new Date(time * 1000).getDate();
    return date;
}


export const getDailyBalanceForMonth = async (walletAddr, year, month) => {
    const nowDate = new Date();

    const lowBound = getTimeStamp(year, month, 2);
    // console.log(year, month)
    let UpperBound = month != 12 ? getTimeStamp(year, 1 * (month) + 1, 1) : getTimeStamp(1 * (year) + 1, 1, 1)
    let getBlockPromises = [];
    let firstBlock;

    getBlockPromises.push(new Promise(async (resolve, reject) => {
        try {
            firstBlock = await getBlockNumber(lowBound);
            resolve();
        }
        catch (e) {
            reject(e);
        }
    }));
    if (UpperBound > parseInt(nowDate.getTime() / 1000))
        UpperBound = parseInt(nowDate.getTime() / 1000);

    let lastBlock;
    getBlockPromises.push(new Promise(async (resolve, reject) => {
        try {
            lastBlock = await getBlockNumber(UpperBound);

            resolve();
        }
        catch (e) {
            reject(e);
        }
    }))
    await Promise.all(getBlockPromises);

    const Txlist = await getTxList(walletAddr, firstBlock, lastBlock);

    if (!Txlist || !Txlist.filter || Txlist.length == 0) {
        return [];
    }


    /* txlist to get daily balance */

    let filterTxList = Txlist.filter((tx, index) => {
        if (index == Txlist.length - 1) {
            return true;
        }
        else if (tx.timeStamp * 1 < Txlist[index + 1].timeStamp * 1 - 24 * 3600) {
            return true;
        }
        else {
            return false;
        }

    });

    let promises = [];

    filterTxList.map((tx, index) => {
        let _date = new Date(filterTxList[index].timeStamp * 1000);
        promises.push(new Promise((resolve, reject) => {
            web3.eth.getBalance(walletAddr, tx.blockNumber * 1).then(res => {
                tx.balance = res;
                tx.date = tx.timeStamp < lowBound ? 1 : _date.getDate();
                resolve(res);
            })
                .catch(e => {
                    reject(e)
                });
        }))
    })
    await Promise.all(promises);

    filterTxList.sort((a, b) => {

        return a.timeStamp > b.timeStamp ? 1 : -1;
    });
    return filterTxList;
}


/* -------------------------------------------------- */
export const getBeforeMonthBalance = async (walletAddr, year, month) => {
    // console.log(year,month)
    let blockNumber;
    const blockNumberStore = localStorage.getItem("blockNumber");
    if (blockNumberStore) {

        let blockNumbers = JSON.parse(blockNumberStore);
        if (blockNumbers[`${year}-${month}`]) {
            blockNumber = blockNumbers[`${year}-${month}`];
        }
        else {
            const timestamp = new Date(`${year}-${month}-1`).getTime() / 1000;
            blockNumber = await getBlockNumber(parseInt(timestamp));
            blockNumbers[`${year}-${month}`] = blockNumber;
            localStorage.setItem("blockNumber", JSON.stringify(blockNumbers));
        }

    }
    else {
        const timestamp = new Date(`${year}-${month}-1`).getTime() / 1000;
        blockNumber = await getBlockNumber(parseInt(timestamp));
        localStorage.setItem("blockNumber", JSON.stringify({ [`${year}-${month}`]: blockNumber }));

    }
    // console.log(blockNumber, year + "-" + month)
    const balance = await web3.eth.getBalance(walletAddr, blockNumber);
    //console.log("balance",year, month,balance)
    return balance;
}


/* -------------------------------------------------- */
export const getDailyPnL = async (walletAddr, year, month) => {
    let balanceList;

    let beforeBalance;

    let promise1 = new Promise(async (resolve, reject) => {
        balanceList = await getDailyBalanceForMonth(walletAddr, year, month);

        resolve();
    })
    let promise2 = new Promise(async (resolve, reject) => {
        beforeBalance = await getBeforeMonthBalance(walletAddr, year, month);
        resolve();
    })
    await Promise.all([promise1, promise2]);

    let PnLlist = [];
    let nowDate = new Date();
    const nowYear = nowDate.getFullYear();
    const nowMonth = nowDate.getMonth() * 1 + 1;
    nowDate = nowDate.getDate();
    balanceList.map((tx, index) => {
        //console.log(tx.balance, beforeBalance * 1)
        if (index == 0) {
            for (let i = 1; i < 1 * (tx.date); i++) {
                PnLlist.push({ FullDate: `${year}-${month}-${i}`, PnL: 0, })
            }

            PnLlist.push({ FullDate: `${year}-${month}-${tx.date}`, PnL: ((tx.balance * 1 - beforeBalance * 1) / 10 ** 18).toFixed(4) * 1, });
        }
        else {
            PnLlist.push({ FullDate: `${year}-${month}-${tx.date}`, PnL: ((tx.balance * 1 - 1 * balanceList[index - 1].balance) / 10 ** 18).toFixed(4) * 1, });

        }
        let lastDate = balanceList[index + 1] ? balanceList[index + 1].date : DatesOfMonth[month];

        if (!balanceList[index + 1] && year == nowYear && month == nowMonth) {
            lastDate = nowDate;
        }
        if (tx.date != lastDate - 1) {

            for (let i = 1 * (tx.date) + 1; i < lastDate * 1; i++) {

                PnLlist.push({ FullDate: `${year}-${month}-${i}`, PnL: 0 });

            }
        }
    })
    return PnLlist;

}
export const getMonthlyPNL = async (walletAddr, year) => {
    // console.log(walletAddr,"walletaddr")
    let MonthBalanceList = [];
    const nowDate = new Date();
    const nowYear = nowDate.getFullYear();
    const nowMonth = nowDate.getMonth() * 1 + 1;
    let lastMonth = 12;

    if (nowYear == year) {
        lastMonth = nowMonth;
    }

    let promises = [];

    for (let i = 1; i < lastMonth + 1; i++) {
        promises.push(new Promise(async (resolve, reject) => {
            MonthBalanceList[i - 1] = await getBeforeMonthBalance(walletAddr, year, i);
            resolve();
        }));
    }
    if (nowYear != year) {
        promises.push(new Promise(async (resolve, reject) => {
            MonthBalanceList[12] = await getBeforeMonthBalance(walletAddr, year * 1 + 1, 1);
            resolve();
        }));
    } 
    else {
        promises.push(new Promise(async (resolve, reject) => {
            MonthBalanceList[lastMonth] = await web3.eth.getBalance(walletAddr);
            resolve();
        }))

    }
    await Promise.all(promises);
    // console.log(MonthBalanceList, "monthB")
    let PnLlist = [];
    MonthBalanceList.map((monthBal, index) => {
        if (index == 0) return;
        PnLlist.push({ PnL: ((monthBal - MonthBalanceList[index - 1]) / 10 ** 18).toFixed(4) * 1, FullDate: `${year}-${index}` });
    });
    return PnLlist;
}


export const getYearlyPnLList = async (walletAddr) => {

    let startYear = 2016;
    let lastYear = new Date().getFullYear();
    let promises = [];
    let YearlyBalance = [];

    for (let i = 0; i <= lastYear - startYear; i++) {

        promises.push(new Promise(async (resolve, reject) => {
            YearlyBalance[i] = await getBeforeMonthBalance(walletAddr, startYear + i, 1);
            resolve();
        }));
        // console.log(i, "year")

    }

    promises.push(
        new Promise(async (resolve, reject) => {
            let nowBalance = await web3.eth.getBalance(walletAddr);
            YearlyBalance[lastYear - startYear + 1] = nowBalance;
            resolve();
        })
    );

    await Promise.all(promises);

    let YearlyPnl = [];
    YearlyBalance.map((balance, index) => {
        if (index == YearlyBalance.length - 1) {
            return;
        }
        YearlyPnl.push({
            PnL: ((YearlyBalance[index + 1] - balance) / 10 ** 18).toFixed(4) * 1,
            FullDate: startYear + index,
        })
    });

    return YearlyPnl;
}

