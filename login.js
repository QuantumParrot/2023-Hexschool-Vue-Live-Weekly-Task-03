import axios from 'https://cdnjs.cloudflare.com/ajax/libs/axios/1.6.5/esm/axios.min.js';

import { createApp } from 'https://cdnjs.cloudflare.com/ajax/libs/vue/3.4.13/vue.esm-browser.min.js';

import loader from './loader.js';

const app = createApp({

    data() {

        return {

            apiUrl: 'https://ec-course-api.hexschool.io/v2',
            msg: '',
            user: {
                username: '',
                password: '',
            },
            isLoading: false,
            isLoginDisabled: false,

        }

    },

    components: { loader },

    watch: {

        user: {

            handler(curr) {

                if (curr.username || curr.password) { this.msg = '' }

            },

            deep: true,

        }

    },

    methods: {

        login() {

            if (!this.user.username || !this.user.password) {

                this.msg = '請輸入帳號與密碼';

            } else {

                this.isLoading = true;
                this.isLoginDisabled = true,
                this.msg = '登入中，請稍候',
    
                axios.post(`${this.apiUrl}/admin/signin`, this.user)
                .then(res => {
                    // console.log(res);
                    const { expired, message, token } = res.data;
                    document.cookie = `hexVueToken=${token}; expires=${new Date(expired)}`;
                    this.isLoading = false;
                    this.msg = message;
                    this.isLoginDisabled = false;
                    this.redirect();
                })
                .catch(error => {
                    console.log(error);
                    this.isLoading = false;
                    this.msg = error.response.data.message;
                    this.isLoginDisabled = false;
                })

            }

        },

        checkToken() {

            const token = document.cookie.split('; ')
            .find(row => row.startsWith('hexVueToken='))?.split('=')[1];

            if (token) {

                axios.defaults.headers.common['Authorization'] = token;

                axios.post(`${this.apiUrl}/api/user/check`, {})
                .then(res => {

                    // console.log(res);
                    this.redirect();

                })
                .catch(error => { console.log(error) })

            }

        },

        redirect() { window.location.href="./index.html" }

    },

    mounted() {

        // 如果處於登入狀態，則自動跳轉至首頁 ( 商品列表 )

        // 這部分似乎無法由前端處理，前端只能拆 token 出來，無法驗證 token 是否正確

        // 如果不交由後端，遇上 token 不正確或過期的情形時，使用者會被 index 和 login 當成皮球踢來踢去 ... (´・ω・`)

        this.checkToken();

    }

});

app.mount('#app');