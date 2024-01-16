import { createApp } from 'https://cdnjs.cloudflare.com/ajax/libs/vue/3.4.13/vue.esm-browser.min.js';

import loader from './loader.js';

const app = createApp({

    data() {

        return {

            apiUrl: 'https://ec-course-api.hexschool.io/v2',
            path: 'ataraxia',

            isLoading: false,
            
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
                    alert(error.response.data.message);
                })

            } else {

                alert('請登入');
                window.location.href="./login.html";

            }

        },

        getProductData() {

            this.isLoading = true;

            axios.get(`${this.apiUrl}/api/${this.path}/admin/products/all`)
            .then(res => {
                // console.log(res.data);
                this.products = Object.values(res.data.products);
                this.resetDisplay();
                this.isLoading = false;
            })
            .catch(error => {
                console.log(error);
                this.isLoading = false;
            })

        },

        sort(value) { 
            
            this.sortBy = value;
            this.ascending = !this.ascending;
        
        },

        createProduct() {

            // 打開 modal 並清空 tempProduct 的資料

            this.resetTempProduct();
            this.showModal();

        },

        removeProduct(id) {

            this.isLoading = true;

            axios.delete(`${this.apiUrl}/api/${this.path}/admin/product/${id}`)
            .then(res => {
                // console.log(res.data);
                this.getProductData();
            })
            .catch(error => {
                console.log(error);
                this.isLoading = false;
            })

        },

        editProduct(product) {

            // 打開 modal 並讓 tempProduct 指向 product 的深拷貝 ( 因為 imagesUrl 為陣列 )
            
            this.tempProduct = JSON.parse(JSON.stringify(product));
            this.showModal();
        
        },

        saveProduct() {

            // 如果有 id 屬性就是編輯，反之則是新增

            this.isLoading = true;

            if (this.tempProduct.id) {

                axios.put(`${this.apiUrl}/api/${this.path}/admin/product/${this.tempProduct.id}`, { data: this.tempProduct })
                .then(res => {
                    // console.log(res.data);
                    this.hideModal();
                    this.getProductData();
                    this.resetTempProduct();
                })
                .catch(error => {
                    console.log(error);
                    this.isLoading = false;
                })

            } else {

                const { image1, image2, image3, image4, image5 } = this;

                this.tempProduct.imagesUrl = [ image1, image2, image3, image4, image5 ];

                axios.post(`${this.apiUrl}/api/${this.path}/admin/product`, { data: this.tempProduct })
                .then(res => {
                    // console.log(res.data);
                    this.hideModal();
                    this.getProductData();
                    this.resetTempProduct();
                })
                .catch(error => {
                    console.log(error);
                    this.isLoading = false;
                });

            }

        },

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

        showModal() { this.modal.show() },

        hideModal() { this.modal.hide() },

    },

    created() { this.checkToken(); },

    mounted() { this.modal = new bootstrap.Modal(this.$refs.productModal); }

});

app.mount('#app');