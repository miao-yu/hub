import Vue from 'vue';
import Router from 'vue-router';
import Checkout from './views/Checkout.vue';
import CheckoutOverview from './views/CheckoutOverview.vue';
import CheckoutSelectAccount from './views/CheckoutSelectAccount.vue';
import CheckoutSuccess from './views/CheckoutSuccess.vue';
import Signup from './views/Signup.vue';
import SignupTypeSelector from './views/SignupTypeSelector.vue';
import SignupSetLabelLogin from './views/SignupSetLabelLogin.vue';
import SignupSetLabelAddress from './views/SignupSetLabelAddress.vue';
import SignupSuccess from './views/SignupSuccess.vue';
import MetaAbout from './views/MetaAbout.vue';
import {RequestType} from '@/lib/RequestTypes';
import {KeyguardCommand} from '@nimiq/keyguard-client';

Vue.use(Router);

export const keyguardResponseRouter: { [index: string]: {resolve: string, reject: string} } = {
    [KeyguardCommand.SIGN_TRANSACTION]: {
        resolve: `${RequestType.CHECKOUT}-success`,
        reject: RequestType.CHECKOUT,
    },
};

export default new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    {
      path: `/${RequestType.CHECKOUT}`,
      component: Checkout,
      children: [
        {
          path: '',
          name: RequestType.CHECKOUT,
          component: CheckoutOverview,
        },
        {
          path: 'change-account',
          name: `${RequestType.CHECKOUT}-change-account`,
          component: CheckoutSelectAccount,
        },
        {
          path: 'success',
          name: `${RequestType.CHECKOUT}-success`,
          component: CheckoutSuccess,
        },
      ],
    },
    {
      path: `/${RequestType.SIGNUP}`,
      component: Signup,
      children: [
            {
                path: '',
                name: RequestType.SIGNUP,
                component: SignupTypeSelector,
            },
            {
                path: 'set-label-login',
                name: `${RequestType.SIGNUP}-set-label-login`,
                component: SignupSetLabelLogin,
            },
            {
                path: 'set-label-address',
                name: `${RequestType.SIGNUP}-set-label-address`,
                component: SignupSetLabelAddress,
            },
            {
                path: 'success',
                name: `${RequestType.SIGNUP}-success`,
                component: SignupSuccess,
            },
       ],
    },
    {
      path: '/meta-about',
      name: 'meta-about',
      component: MetaAbout,
    },
  ],
});
