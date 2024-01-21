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
            
            tempProduct: {},
            image1: '',
            image2: '',
            image3: '',
            image4: '',
            image5: '',

            display: {},
            
            modal: '',
            confirmModal: '',

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

        // 建立商品

        createProduct() {

            // 打開 modal 並清空 tempProduct 的資料

            this.resetTempProduct();
            this.showModal();

        },

        // 編輯商品

        editProduct(product) {

            this.resetTempProduct();

            // 打開 modal 並讓 tempProduct 指向 product 的深拷貝 ( 因為 imagesUrl 為陣列 )
            
            this.tempProduct = JSON.parse(JSON.stringify(product));
            this.tempProduct.imagesUrl.forEach((item, idx) => { this[`image${idx+1}`] = item })
            this.showModal();
        
        },

        // 儲存商品資料 ( 新增與編輯共用 )

        saveProduct() {

            // 如果有 id 屬性就是編輯，反之則是新增

            this.isLoading = true;
            this.isButtonDisabled = true;

            if (this.tempProduct.id) {

                axios.put(`${this.apiUrl}/api/${this.path}/admin/product/${this.tempProduct.id}`, { data: this.tempProduct })
                .then(res => {
                    // console.log(res.data);
                    this.hideModal();
                    this.toastAlert('成功編輯商品資料！', 'success');
                    this.getProductData();
                    this.resetTempProduct();
                })
                .catch(error => {
                    console.log(error);
                    this.isLoading = false;
                    this.isButtonDisabled = false;
                })

            } else {

                if (Object.keys(this.tempProduct).some(key => key !== 'is_enabled' && !this.tempProduct[key])) {

                    this.toastAlert('欄位不得空白', 'warning');
                    this.isLoading = false;
                    this.isButtonDisabled = false;

                } else {

                    const { image1, image2, image3, image4, image5 } = this;

                    const imagesUrl = [ image1, image2, image3, image4, image5 ];

                    this.tempProduct.imagesUrl = imagesUrl.filter(i => i);
    
                    axios.post(`${this.apiUrl}/api/${this.path}/admin/product`, { data: this.tempProduct })
                    .then(res => {
                        // console.log(res.data);
                        this.hideModal();
                        this.toastAlert('成功建立新商品！', 'success');
                        this.getProductData();
                        this.resetTempProduct();
                    })
                    .catch(error => {
                        console.log(error);
                        this.toastAlert(error.response.data.message, 'error');
                        this.isLoading = false;
                        this.isButtonDisabled = false;
                    });

                }

            }

        },

        // 確認是否刪除

        confirmRemove(product) {

            this.tempProduct = product;
            this.showModal('remove');

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

        resetTempProduct() {

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
            };

            this.image1 = '';
            this.image2 = '';
            this.image3 = '';
            this.image4 = '';
            this.image5 = '';

        },

        // 打開 Modal

        showModal(type) {

            if (type === 'remove') { this.confirmModal.show() } 
            else { this.modal.show() }
            
        },

        // 關閉 Modal

        hideModal(type) { 
            
            if (type === 'remove') { this.confirmModal.hide() }
            else { this.modal.hide() }
        
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
        
        this.modal = new bootstrap.Modal(this.$refs.productModal);
        this.confirmModal = new bootstrap.Modal(this.$refs.confirmModal);
    
    }

});

app.mount('#app');