<template>
    <div class="container pad-bottom">
        <SmallPage>
            <StatusScreen
                :title="title"
                :status="status"
                :state="state"
                :message="warningMessage"
                :mainAction="warningAction"
                @main-action="reloadPage"
                :lightBlue="true"
            />
            <Network ref="network" :visible="false"/>
        </SmallPage>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { Static } from '../lib/StaticStore';
import { State } from 'vuex-class';
import { SmallPage } from '@nimiq/vue-components';
import Network from '../components/Network.vue';
import StatusScreen from '../components/StatusScreen.vue';
import KeyguardClient from '@nimiq/keyguard-client';

@Component({components: {StatusScreen, Network, SmallPage}})
export default class CheckoutTransmission extends Vue {
    @Static private keyguardRequest!: KeyguardClient.SignTransactionRequest;
    @State private keyguardResult!: KeyguardClient.SignTransactionResult;

    private isTxSent: boolean = false;
    private status: string = 'Connecting to network...';

    private txSendingFailed: boolean = false;
    private warningMessage: string = 'Your payment could not be sent to the network. Please reload the page to retry.';
    private warningAction: string = 'Reload page';

    private created() {
        const $subtitle = document.querySelector('.logo .logo-subtitle')!;
        $subtitle.textContent = 'Checkout';
    }

    private async mounted() {
        this.addConsensusListeners();
        const tx = await (this.$refs.network as Network).createTx(Object.assign({
            signerPubKey: this.keyguardResult.publicKey,
        }, this.keyguardResult, this.keyguardRequest));
        const result = await (this.$refs.network as Network).sendToNetwork(tx);
        this.isTxSent = true;

        setTimeout(() => this.$rpc.resolve(result), StatusScreen.SUCCESS_REDIRECT_DELAY);
    }

    private addConsensusListeners() {
        const network = (this.$refs.network as Network);
        network.$on(Network.Events.API_READY, () => this.status = 'Contacting seed nodes...');
        network.$on(Network.Events.CONSENSUS_SYNCING, () => this.status = 'Syncing consensus...');
        network.$on(Network.Events.CONSENSUS_ESTABLISHED, () => this.status = 'Sending transaction...');
        network.$on(Network.Events.TRANSACTION_PENDING, () => this.status = 'Awaiting receipt confirmation...');

        // Prepare tx sending timeout
        network.$once(Network.Events.CONSENSUS_ESTABLISHED, () => {
            // Fail when transaction not relayed after 8 seconds
            setTimeout(() => { this.txSendingFailed = true; }, 8000);
        });
    }

    private reloadPage() {
        if (this.isTxSent) return;
        location.reload();
    }

    private get state(): StatusScreen.State {
        if (this.isTxSent) return StatusScreen.State.SUCCESS;
        if (this.txSendingFailed) return StatusScreen.State.WARNING;
        return StatusScreen.State.LOADING;
    }

    private get title(): string {
        if (this.isTxSent) return 'Payment successful.';
        if (this.txSendingFailed) return 'Could not send payment';
        return 'Processing your payment';
    }
}
</script>
