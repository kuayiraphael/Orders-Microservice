const Order = require('../models/Order');

const Cart = require('../models/Cart');
const { v4: uuidv4 } = require('uuid');

class ShoppingRepository {

    async Orders(customerId){

        const orders = await Order.find({customerId });
        
        return orders;

    }

    async Cart(customerId){

        const cartItems = await Cart.find({ customerId});

        if(cartItems){
            return cartItems;
        }

        return []
    }

    async AddCartItem(customerId,item,qty,isRemove){
 

            const cart = await Cart.findOne({ customerId: customerId })

            const { _id } = item;

            if(cart){
                
                let isExist = false;

                let cartItems = cart.items;

                if(cartItems.length > 0){

                    cartItems.map(item => {
                                                
                        if(item.product._id.toString() === _id.toString()){
                            if(isRemove){
                                cartItems.splice(cartItems.indexOf(item), 1);
                             }else{
                               item.unit = qty;
                            }
                             isExist = true;
                        }
                    });
                } 
                
                if(!isExist && !isRemove){
                    cartItems.push({product: { ...item}, unit: qty });
                }

                cart.items = cartItems;

                return await cart.save()
 
            }else{

               return await Cart.create({
                    customerId,
                    items:[{product: { ...item}, unit: qty }]
                })
            }

        
    }
 
    async CreateNewOrder(customerId){

        const cart = await Cart.findOne({ customerId: customerId })

        if(cart){         
            
            let amount = 0;   

            let cartItems = cart.items;

            if(cartItems.length > 0){
                //process Order
                
                cartItems.map(item => {
                    
                    amount += parseFloat(item.product.price) *  parseInt(item.unit);   
                });
    
                const orderId = uuidv4();
    
                const order = new Order({
                    orderId,
                    customerId,
                    amount,
                    status: 'received',
                    items: cartItems
                })
    
                cart.items = [];
                
                const orderResult = await order.save();
                await cart.save();
                return orderResult;


            }

 

        }

        return {}
    }

}

module.exports = ShoppingRepository;
