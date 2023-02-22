const querySearch = new URLSearchParams(window.location.search);
const contractAddress = querySearch.get("address");
const today = new Date().toISOString().slice(0, 16);

const tonweb = new TonWeb(
  new TonWeb.HttpProvider(
      'https://' + (window.localStorage.getItem("testnet") === 'true' ? 'testnet.toncenter.com/api/v2/jsonRPC' : 'scalable-api.tonwhales.com/jsonRPC'),
      {}
  )
);
const Cell = tonweb.boc.Cell;

let subdomain =
  window.localStorage.getItem("testnet") === "true" ? "testnet." : "";
let currentTonWallets = [];
let buttonType = "withdraw";
let selectedToken = null;

const contractData = {
  balances: {},
};

const userData = {
  balances: {},
};

const countCharts = function (string, c) {
  var result = 0,
    i = 0;
  for (i; i < string.length; i++) if (string[i] === c) result++;
  return result;
};

const convertBalance = (number = 0, decimals = 9) => {
  return number / 10 ** Number(decimals);
};

const numberToLocalString = (number = 0) => {
  return number.toLocaleString("en-En");
};

const updateList = () => {
  const selectList = document.getElementById("tokenSelect");
  const walletBalanceEl = document.getElementById("walletBalance");

  selectList.innerHTML = "";

  const object = buttonType === "pay" ? userData : contractData;

  const isTonExist = object.balances.TON || null;

  if (selectedToken && !object.balances[selectedToken]) {
    selectedToken = null;
  }

  if (!selectedToken && isTonExist) {
    selectedToken = "TON";
  }

  Object.values(object.balances).forEach((token, index) => {
    const { metadata } = token;
    const { symbol } = metadata;

    if (!selectedToken && !isTonExist && index === 0) {
      selectedToken = symbol;
    }

    selectList.innerHTML += `<option value="${symbol}">${symbol}</option>`;
  });

  const selectedTokenBalance = object.balances[selectedToken]?.balance || 0;

  if (!isNaN(selectedTokenBalance)) {
    walletBalanceEl.innerText = `Balance: ${numberToLocalString(
      selectedTokenBalance
    )} ${selectedToken}`;
  }

  selectList.value = selectedToken;
};

const loadWallets = async () => {
  const result = await window.ton.send("ton_requestAccounts");

  currentTonWallets = result || [];
};

const getContractTonBalance = async (
  searchAddress = contractAddress,
  object = contractData
) => {
  const result = await fetch(
    `https://${subdomain}tonapi.io/v1/account/getInfo?account=${searchAddress}`,
    {
      headers: {
        ["Content-Type"]: "application/json",
      },
    }
  ).then((res) => res.json());

  const { balance, address, icon } = result;
  const { bounceable } = address;

  object.balances.TON = {
    balance: convertBalance(balance),
    walletAddress: bounceable,
    metadata: {
      symbol: "TON",
      image: icon,
      decimals: 9,
    },
    isNative: true
  };
};

const getContractJettonsBalance = async (
  searchAddress = contractAddress,
  object = contractData
) => {
  const result = await fetch(
    `https://${subdomain}tonapi.io/v1/jetton/getBalances?account=${searchAddress}`,
    {
      headers: {
        ["Content-Type"]: "application/json",
      },
    }
  ).then((res) => res.json());

  result.balances.forEach((value) => {
    const { balance, metadata, wallet_address } = value;
    const { symbol, decimals, image } = metadata;
    const { address } = wallet_address;

    object.balances[symbol] = {
      balance: convertBalance(balance, decimals),
      walletAddress: address,
      metadata: {
        symbol,
        image,
        decimals,
      },
      isNative: false
    };
  });
};

const getContractInfo = async () => {
  console.log(contractAddress);
  let result = await tonweb.provider.call2(contractAddress, 'lockup_data');
  let owner = result[0].beginParse().loadAddress();
  let receiver = result[1].beginParse().loadAddress();
  return {
    owner: owner ? owner.toString(1, 1, 1) : null,
    receiver: receiver ? receiver.toString(1, 1, 1) : null,
    unlockedAt: parseInt(result[2].toString()),
  };
};

const payTypeChanged = () => {
  if (buttonType === "withdraw") {
    buttonType = "pay";
  } else if (buttonType === "pay") {
    buttonType = "withdraw";
  }

  document.getElementById("amount").value = "";

  updateList();

  document.getElementById("payFormButton").innerText = buttonType;
};

const tokenSelectedChange = () => {
  document.getElementById("amount").value = "";

  const newSelectedToken =
    document.getElementById("tokenSelect").selectedOptions[0].value;

  selectedToken = newSelectedToken;

  updateList();
};

const changeUnblockTime = () => {
  let newUnblockTime = document.getElementById("updateUblockTime").value;

  if (!newUnblockTime) {
    return;
  } else {
    const unblockDate = new Date(newUnblockTime);
    newUnblockTime = unblockDate.getTime();
  }
};

const onAmountChange = () => {
  const inputEl = document.getElementById("amount");

  console.debug("inputEl", inputEl.values);

  const object =
    buttonType === "pay" ? userData.balances : contractData.balances;
  const tokenData = object[selectedToken];

  let newValue = (inputEl.value || "").replace(/[^\d.]+/g, "");

  if (countCharts(newValue || "", ".") > 1) {
    inputEl.value = Math.trunc(tokenData.balance);

    return false;
  }

  if (countCharts(newValue || "", ".") === 1) {
    const chartsAfterDot = newValue.split(".")[1];

    if (chartsAfterDot.length > tokenData.metadata.decimals) {
      inputEl.value = tokenData.balance;

      return false;
    }
  }

  if (Number(inputEl.value) > Number(tokenData.balance)) {
    inputEl.value = tokenData.balance;

    return false;
  }

  inputEl.value = newValue;
};

const depositFunds = async (symbol, amount) => {
  if (userData.balances[symbol].balance < amount) {
    alert("Insufficient funds");
    return;
  }

  if (userData.balances[symbol].isNative) { // if this TON
    let query = {
        to: contractAddress,
        value: tonweb.utils.toNano(amount.toString())
    };

    await window.ton.send('ton_sendTransaction', [query]);
  } else { // work with jettons
    let msgBody = new Cell();
    msgBody.bits.writeUint(0xf8a7ea5, 32);
    msgBody.bits.writeUint(0, 64);
    msgBody.bits.writeCoins(new tonweb.utils.BN('AMOUNT'));
    msgBody.bits.writeAddress(new tonweb.Address(contractAddress)); // destination address
    msgBody.bits.writeAddress(new tonweb.Address(contractAddress)); // gas response address
    msgBody.bits.writeUint(0, 1);
    msgBody.bits.writeCoins(new tonweb.utils.BN('0.05'));
    msgBody.bits.writeUint(0, 1);

    let query = {
        to: new tonweb.Address(userData.balances[symbol].walletAddress),
        value: tonweb.utils.toNano('0.1'),
        data: tonweb.utils.bytesToBase64(await msgBody.toBoc(false)),
        dataType: 'boc',
    };

    await window.ton.send('ton_sendTransaction', [query]);
  }
}

const withdrawFunds = async (symbol, targetAddress, amount) => {
  if (contractData.balances[symbol].balance < amount) {
    alert("Insufficient funds");
    return;
  }

  if (contractData.balances[symbol].isNative) { // if this TON
    let msgBody = new Cell();
    msgBody.bits.writeAddress(new tonweb.Address(targetAddress));
    msgBody.bits.writeCoins(tonweb.utils.toNano(amount.toString()));

    let payload = new Cell();
    payload.bits.writeUint(0xb5de5f9e, 32);
    payload.bits.writeUint(0, 64);
    payload.refs.push(msgBody);

    let query = {
        to: contractAddress,
        value: tonweb.utils.toNano('0.05'),
        data: tonweb.utils.bytesToBase64(await payload.toBoc(false)),
        dataType: 'boc',
    };

    await window.ton.send('ton_sendTransaction', [query]);
  } else { // work with jettons
    let transferMsgBody = new Cell();
    msgBody.bits.writeUint(0xf8a7ea5, 32);
    msgBody.bits.writeUint(0, 64);
    msgBody.bits.writeCoins(new tonweb.utils.BN('AMOUNT'));
    msgBody.bits.writeAddress(new tonweb.Address(targetAddress)); // destination address
    msgBody.bits.writeAddress(new tonweb.Address(targetAddress)); // gas response address
    msgBody.bits.writeUint(0, 1);
    msgBody.bits.writeCoins(new tonweb.utils.BN('0.001'));
    msgBody.bits.writeUint(0, 1);

    let msgBody = new Cell();
    msgBody.bits.writeAddress(new tonweb.Address(contractData.balances[symbol].walletAddress));
    msgBody.bits.writeCoins(tonweb.utils.toNano('0.05'));
    msgBody.refs.push(transferMsgBody);

    let payload = new Cell();
    payload.bits.writeUint(0xb5de5f9e, 32);
    payload.bits.writeUint(0, 64);
    payload.refs.push(msgBody);

    let query = {
        to: new tonweb.Address(contractAddress),
        value: tonweb.utils.toNano('0.06'),
        data: tonweb.utils.bytesToBase64(await payload.toBoc(false)),
        dataType: 'boc',
    };

    await window.ton.send('ton_sendTransaction', [query]);
  }
};

const extendUnlockTime = async (extendValue) => {
  let payload = new Cell();
    payload.bits.writeUint(0xceba1400, 32);
    payload.bits.writeUint(0, 64);
    payload.bits.writeUint(extendValue, 64);

    let query = {
        to: new tonweb.Address(contractAddress),
        value: tonweb.utils.toNano('0.05'),
        data: tonweb.utils.bytesToBase64(await payload.toBoc(false)),
        dataType: 'boc',
    };

    await window.ton.send('ton_sendTransaction', [query]);
};

window.addEventListener("DOMContentLoaded", () => {
  if (!contractAddress || !window.ton) {
    window.location = "/";

    return;
  }

  document.getElementById("updateUblockTime").min = today;
  document.getElementById("contractId").innerText = contractAddress;

  document.getElementById("payFormButton").innerText = buttonType;

  loadWallets().then(() => {
    Promise.all([
      getContractTonBalance(),
      getContractJettonsBalance(),
      getContractInfo(),
      getContractTonBalance(currentTonWallets[0], userData),
      getContractJettonsBalance(currentTonWallets[0], userData),
      ,
    ]).then(() => {
      updateList();
    });
  });
});
