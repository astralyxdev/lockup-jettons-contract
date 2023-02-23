let currentForm = "main";
const tonweb = new TonWeb(
  new TonWeb.HttpProvider(
      ('https://' + (window.localStorage.getItem("testnet") === 'true' ? 'testnet.toncenter.com/api/v2/jsonRPC' : 'scalable-api.tonwhales.com/jsonRPC'),
      {}
  )
));
const Cell = tonweb.boc.Cell;

class LockupJettonsContract extends tonweb.Contract {
  constructor(provider, options) {
      options.code = Cell.oneFromBoc("B5EE9C7201020B0100021B000114FF00F4A413F4BCF2C80B01020162020303F8D03331D0D303FA403020FA4401C000F2E14D0271B0925F03E002D31FD33F2282107A4C6D4ABA8E29135F03ED4482107A4C6D4AC8CB1F12CB3FCCC9718010C8CB055003CF1670FA0212CB6ACCC98040FB00E031ED44D0F404FA40D33FFA40302582107362D09CBAE30236248210F6D29301BAE30224821016B628BFBA040506001FA1828BDA89A1E809F481A67FF4806007007C353621D765C10B8E3153418307F40E6FA193FA0030923070E203FA003013A0C801FA0240448307F443503303C8F40058CF16CB3F01CF16C9ED54925F06E20034345054C705F2E191FA403003C8F40058CF16CB3F01CF16C9ED5401C08E1A3415C705F2E191FA40300203C8F40058CF16CB3F01CF16C9ED54E0248210CEBA1400BA8E20345154C705F2E19101D33F3058B609430303C8F40058CF16CB3F01CF16C9ED54E0248210D53276DBBA925F07E0048210B5DE5F9EBAE3025F0607014C5155C705F2E19122F823BBF2E1929321D74A8AE831431303C8F40058CF16CB3F01CF16C9ED540802FC01D401D0FA4021FA443101FA00D30001C00192D43092306DE253258307F40E6FA1226EB3B08E3721D0D31F2182100F8A7EA5BA028210595F07BCBA12B18E1B8040D721FA003001FA003001A170B609C801FA0240368307F44304925B32E2923032E2708018C8CB055004CF1601FA0212CB69216EB3947032CB00E30DC970090A000A7101CB00CC0006FB0001");
      super(provider, options);
  }

  createDataCell() {
      const cell = new Cell();
      cell.bits.writeUint(0, 1);
      cell.bits.writeAddress(this.options.receiverAddress);
      cell.bits.writeUint(this.options.unlockedAt, 64);
      cell.bits.writeAddress(this.options.ownerAddress);
      return cell;
  }
}

const today = new Date().toISOString().slice(0, 16);

// ? Switch forms between create and check contracts
const switchForm = () => {
  if (!window.ton) {
    return;
  }

  if (currentForm === "main") {
    document.querySelector(".form--create").classList.add("form--visible");

    document
      .querySelector(`.form--${currentForm}`)
      .classList.remove("form--visible");

    currentForm = "create";

    document.getElementById("unblockTime").min = today;
  } else if (currentForm === "create") {
    document.querySelector(".form--main").classList.add("form--visible");

    document
      .querySelector(`.form--${currentForm}`)
      .classList.remove("form--visible");

    currentForm = "main";
  }
};

// ? Check contract button submit handler
const checkContract = () => {
  const contractAddress = document.getElementById("contractAddress").value;

  if (!contractAddress) {
    return;
  }

  document.getElementById("contractAddress").value = "";

  openContractPage(contractAddress);
};

// ? Redirect to contract page
// ? address = contract address
const openContractPage = (address) => {
  window.location = `contract.html?address=${address}`;
};

// ? Create contract
const createContract = () => {
  // ? Receiver address
  let receiverAddress = document.getElementById("receiverAddress").value;

  if (!receiverAddress) {
    return;
  }

  // ? Contract unblock time ( empty = no time ) ( unixtimestamp = with time )
  let unblockTime = document.getElementById("unblockTime").value;

  // ? Can change unblock time after contract created
  const canChangeTime = document.getElementById("canChangeTime").checked;

  if (unblockTime) {
    const unblockDate = new Date(unblockTime);
    unblockTime = Math.floor(unblockDate.getTime() / 1000);
  }

  try {
    receiverAddress = new window.TonWeb.Address(receiverAddress);
  } catch { receiverAddress = null; }

  if (!unblockTime || !receiverAddress) {
    alert("Specify receiver address and unblock time.");
    return;
  }

  window.ton.send('ton_requestAccounts').then(async (accounts) => {
    contract = new LockupJettonsContract(tonweb.provider, {
      ownerAddress: canChangeTime ? new TonWeb.Address(accounts[0]) : null,
      receiverAddress: receiverAddress,
      unlockedAt: unblockTime,
    });
    let contractAddress = (await contract.getAddress()).toString(1, 1, 1);
    console.log(contractAddress);

    let payload = new Cell();
    payload.bits.writeUint(0xd53276db, 32);
    payload.bits.writeUint(0, 64);
    let query = {
        to: contractAddress,
        value: '50000000',
        data: tonweb.utils.bytesToBase64(await payload.toBoc(false)),
        dataType: 'boc',
        stateInit: tonweb.utils.bytesToBase64(await ((await contract.createStateInit()).stateInit).toBoc(false)),
    };

    await window.ton.send('ton_sendTransaction', [query]);
  });
};

window.addEventListener("DOMContentLoaded", () => {
  const isTonExtensionExist = window.ton;
  const formToView = isTonExtensionExist ? "main" : "no-ton";

  document.querySelector(`.form--${formToView}`).classList.add("form--visible");
});
