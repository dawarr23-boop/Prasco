/**
 * Validates a MAC address in the format XX:XX:XX:XX:XX:XX or XX-XX-XX-XX-XX-XX
 */
export const MAC_ADDRESS_REGEX = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
