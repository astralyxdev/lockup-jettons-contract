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
      options.code = Cell.oneFromBoc("B5EE9C7201020B0100024D000114FF00F4A413F4BCF2C80B01020162020304F6D03331D0D303FA403020FA4401C000F2E14D0271B0925F03E002D31FD33F312182107A4C6D4ABA8E195F04ED44718010C8CB05F842CF1670FA02CB6ACCC98040FB00E0ED44D0FA4001F862FA4001F861D33F01F863F40401F864D12182107362D09CBAE30232208210F6D29301BAE30220821016B628BFBAE30220040506070045A1828BDA89A1F48003F0C5F48003F0C3A67E03F0C7E80803F0C9A3F085F083F087F089008C3132F844D765C10B8E39F84452108307F40E6FA193FA0030923070E202FA003012A0C801FA02F844128307F443F864F844F843C8F842CF16F841CF16CB3FF400C9ED54915BE2004430F84212C705F2E191FA4030F862F844F843C8F842CF16F841CF16CB3FF400C9ED54004430F84112C705F2E191FA4030F861F844F843C8F842CF16F841CF16CB3FF400C9ED5401E48210CEBA1400BA8E2630F84212C705F2E191D33F30F84301A0F863F844F843C8F842CF16F841CF16CB3FF400C9ED54E0208210D53276DBBA925F03E08210B5DE5F9EBA8EABF84112C705F2E191F843F823BBF2E1929320D74A8AE830F844F843C8F842CF16F841CF16CB3FF400C9ED54E05B0802FED401D0FA4021FA443101FA0020D74AC20091D4926D01E2F84452408307F40E6FA1236EB3B08E3B22D0D31F302082100F8A7EA5BA018210595F07BCBAB18E1F018040D721FA003001FA003001A170B609C801FA02F84441408307F443F864925B32E2925B32E2708018C8CB055004CF1601FA0212CB69216EB3E30FC970FB00090A000A7101CB00CC00087032CB00");
      super(provider, options);
  }

  createDataCell() {
      const cell = new Cell();
      cell.bits.writeAddress(this.options.ownerAddress);
      cell.bits.writeAddress(this.options.receiverAddress);
      cell.bits.writeUint(this.options.unlockedAt, 64);
      cell.bits.writeUint(0, 1);
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
      ownerAddress: canChangeTime ? accounts[0] : null,
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
