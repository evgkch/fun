import { crc32 } from "./crc32";

export const OpCodes = {
    SELF_DESTRUCT: crc32("selfdestruct"),
    DEPOSIT: crc32("deposit"),
    WITHDRAW_FUNDS: crc32("withdraw_funds"),
    CHANGE_OWNER: crc32("change_owner"),
    TRANSFER_MSG_TOOWNER: crc32("transfer_msg_to_owner")
};