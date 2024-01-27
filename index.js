import { createApp } from 'https://cdnjs.cloudflare.com/ajax/libs/vue/3.4.13/vue.esm-browser.min.js';

import loader from './loader.js';

const app = createApp({

    data() {

        return {

            apiUrl: 'https://ec-course-api.hexschool.io/v2',
            path: 'ataraxia',

            isLoading: false,
            isButtonDisabled: false,
            
            products: [],
            
            sortBy: 'origin_price',
            ascending: true,
            
            tempProduct: { imagesUrl: [] },
            display: {},
            
            productModal: '',
            confirmModal: '',

            // 用來決定更新商品時 axios 的串接方法

            isNew: true,

        }

    },

    components: { loader },

    computed: {

        sortProducts() {

        // chatGPT: 必須額外拷貝一份新的陣列作排序，否則似乎會讓 Vue.js 無法追蹤變化 (?)

        return [...this.products].sort((a, b) => this.ascending ? a[this.sortBy] - b[this.sortBy] : b[this.sortBy] - a[this.sortBy])

        }

    },

    methods: {

        // 驗證登入狀態

        checkToken() {

            const token = document.cookie.split('; ')
            .find(row => row.startsWith('hexVueToken='))?.split('=')[1];

            if (token) { 
                
                axios.defaults.headers.common['Authorization'] = token;

                axios.post(`${this.apiUrl}/api/user/check`, {})
                .then(res => {
                    // console.log(res.data);
                    this.getProductData();
                })
                .catch(error => {
                    // console.log(error);
                    this.toastAlert(error.response.data.message, 'error');
                })

            } else {

                this.toastAlert('請登入', 'warning');
                window.location.href="./login.html";

            }

        },

        // 取得商品資料

        getProductData() {

            this.isLoading = true;
            this.isButtonDisabled = true;

            axios.get(`${this.apiUrl}/api/${this.path}/admin/products/all`)
            .then(res => {
                // console.log(res.data);
                this.products = Object.values(res.data.products);
                this.resetDisplay();
                this.isLoading = false;
                this.isButtonDisabled = false;
            })
            .catch(error => {
                console.log(error);
                this.isLoading = false;
                this.isButtonDisabled = false;
            })

        },

        // 排序

        sort(value) { 
            
            this.sortBy = value;
            this.ascending = !this.ascending;
        
        },

        openModal(status, product) {

            if (status === 'create') {

            // 新增

            this.reset();

            this.isNew = true;
            this.productModal.show();

            } else if (status === 'edit') {

            // 編輯

            this.tempProduct = { 
                
                ...product,
                imagesUrl: Array.isArray(product.imagesUrl) ? [ ...product.imagesUrl ] : []
            
            };

            this.isNew = false;
            this.productModal.show();

            } else if (status === 'remove') {

            // 刪除

            this.tempProduct = { 
                
                ...product,
                imagesUrl: Array.isArray(product.imagesUrl) ? [ ...product.imagesUrl ] : []
            
            };

            this.confirmModal.show();

            }

        },

        // 助教的範例中是使用 BS5 提供的 data-bs-dismiss 方法

        hideModal(status) {

            if (status === 'remove') { this.confirmModal.hide() } 
            else { this.productModal.hide() }

        },

        // 儲存商品資料 ( 新增與編輯共用 )

        saveProduct() {

            if (Object.keys(this.tempProduct).some(key => key !== 'is_enabled' && !this.tempProduct[key])) {

            this.toastAlert('欄位不得空白', 'warning');

            } else {

                this.isLoading = true;
                this.isButtonDisabled = true;

                let method = 'post';
                let url = `${this.apiUrl}/api/${this.path}/admin/product`;

                if (!this.isNew) {

                    method = 'put';
                    url = `${this.apiUrl}/api/${this.path}/admin/product/${this.tempProduct.id}`;

                }

                axios[method](url, { data: this.tempProduct })
                .then(res => {
                    // console.log(res.data);
                    this.hideModal();
                    this.toastAlert(res.data.message, 'success');
                    this.getProductData();
                })
                .catch(error => {
                    console.log(error);
                    this.toastAlert(error.response.data.message, 'error');
                    this.isLoading = false;
                    this.isButtonDisabled = false;
                })

            }

        },

        // 刪除商品

        removeProduct() {

            this.hideModal('remove');

            this.isLoading = true;
            this.isButtonDisabled = true;

            axios.delete(`${this.apiUrl}/api/${this.path}/admin/product/${this.tempProduct.id}`)
            .then(res => {
                // console.log(res.data);
                this.toastAlert('我們懷念它 ｡ﾟ(ﾟ´ω`ﾟ)ﾟ｡ ', 'success');
                this.getProductData();
            })
            .catch(error => {
                console.log(error);
                this.isLoading = false;
                this.isButtonDisabled = false;
            })

        },

        // 清空展示

        resetDisplay() { this.display = {} },

        reset() {

            this.tempProduct = {
                title: '',
                description: '',
                content: '',
                price: 0,
                origin_price: 0,
                unit: '',
                category: '',
                imageUrl: '',
                is_enabled: true,
                imagesUrl: [],
            };

        },

        // 提示訊息視窗 ( SweetAlert2 )

        toastAlert(text, icon) {

            Swal.fire({
                position: 'center',
                icon,
                text,
                showConfirmButton: false,
                toast: true,
                timer: 1500,
            })

        },

    },

    created() { this.checkToken(); },

    mounted() { 
        
        this.productModal = new bootstrap.Modal(this.$refs.productModal, { backdrop: 'static' });
        
        this.confirmModal = new bootstrap.Modal(this.$refs.confirmModal);
    
    }

});

app.mount('#app');