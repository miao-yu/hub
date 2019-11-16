import bigInt from 'big-integer';
import { Currency, PaymentMethod, PaymentOptions } from '../PublicRequestTypes';
import { Omit, ParsedPaymentOptions } from '../RequestTypes';
import { toNonScientificNumberString } from '@nimiq/utils';

export interface EtherSpecifics {
    gasLimit?: number | string;
    gasPrice?: string;
    recipient?: string;
}

export type ParsedEtherSpecifics = Omit<EtherSpecifics, 'gasLimit' | 'gasPrice'> & {
    gasLimit?: number;
    gasPrice?: bigInt.BigInteger;
};

export type EtherDirectPaymentOptions = PaymentOptions<Currency.ETH, PaymentMethod.DIRECT>;

export class ParsedEtherDirectPaymentOptions extends ParsedPaymentOptions<Currency.ETH, PaymentMethod.DIRECT> {
    public readonly decimals: number = 18;
    public readonly currency: Currency.ETH = Currency.ETH;
    public readonly type: PaymentMethod.DIRECT = PaymentMethod.DIRECT;
    public amount: bigInt.BigInteger;

    public get total(): bigInt.BigInteger {
        return this.amount.add(this.fee);
    }

    public get fee(): bigInt.BigInteger {
        return this.protocolSpecific.gasPrice!.times(this.protocolSpecific.gasLimit!) || bigInt(0);
    }

    public constructor(option: EtherDirectPaymentOptions) {
        super(option);
        this.amount = bigInt(option.amount); // note that bigInt resolves scientific notation like 2e3 automatically

        let gasLimit: number | undefined;
        if (option.protocolSpecific.gasLimit !== undefined) {
            if (!this.isNonNegativeInteger(option.protocolSpecific.gasLimit)) {
                throw new Error('If provided, gasLimit must be a non-negative integer');
            }
            gasLimit = Number.parseInt(toNonScientificNumberString(option.protocolSpecific.gasLimit), 10);
        }

        let gasPrice: bigInt.BigInteger | undefined;
        if (option.protocolSpecific.gasPrice !== undefined) {
            if (!this.isNonNegativeInteger(option.protocolSpecific.gasPrice)) {
                throw new Error('If provided, gasPrice must be a non-negative integer');
            }
            gasPrice = bigInt(option.protocolSpecific.gasPrice);
        }

        if (option.protocolSpecific.recipient && typeof option.protocolSpecific.recipient !== 'string') {
            // TODO add eth address validation here?
            throw new Error('If a recipient is provided it must be of type string');
        }

        this.protocolSpecific = {
            gasLimit,
            gasPrice,
            recipient: option.protocolSpecific.recipient,
        };
    }

    public update(options: EtherDirectPaymentOptions) {
        const newOptions = new ParsedEtherDirectPaymentOptions(options);
        this.expires = newOptions.expires || this.expires;
        this.amount = newOptions.amount || this.amount;
        this.protocolSpecific = {
            gasLimit: newOptions.protocolSpecific.gasLimit || this.protocolSpecific.gasLimit,
            gasPrice: newOptions.protocolSpecific.gasPrice || this.protocolSpecific.gasPrice,
            recipient: newOptions.protocolSpecific.recipient || this.protocolSpecific.recipient,
        };
    }

    public fiatFee(fiatAmount: number): number {
        if (!this.amount || !fiatAmount) {
            throw new Error('amount and fiatAmount must be provided');
        }

        if (this.fee.isZero()) {
            return 0;
        }

        const decimalMatch = toNonScientificNumberString(fiatAmount).match(/(?:\D)(\d+)$/);
        const decimalCount = decimalMatch ? decimalMatch[1].length : 0;
        const conversionFactor = 10 ** decimalCount; // convert amount to smallest unit for bigint calculations
        return this.fee
            .times(bigInt(Math.round(fiatAmount * conversionFactor)))
            .divide(this.amount) // integer division loss of precision here.
            .valueOf() / conversionFactor;
    }

    public raw(): EtherDirectPaymentOptions {
        return {
            currency: this.currency,
            type: this.type,
            expires: this.expires,
            amount: this.amount.toString(),
            protocolSpecific: {
                gasLimit: this.protocolSpecific.gasLimit,
                gasPrice: this.protocolSpecific.gasPrice
                    ? this.protocolSpecific.gasPrice.toString()
                    : undefined,
                recipient: this.protocolSpecific.recipient,
            },
        };
    }
}
