jQuery(document).ready(function()
{

    if (jQuery('#secp_no_ad').is(":checked")) {
        jQuery('.secp-ads-box').addClass('active')
    }

    jQuery('#secp_no_ad').click(function(){
        if (jQuery('#secp_no_ad').is(":checked")) {
            jQuery('.secp-ads-box').addClass('active')
        }else{
            jQuery('.secp-ads-box').removeClass('active')
        }
    })

    jQuery('[data-role=secp_shortcode]').change(function(){
        secp_shortcode.generate();
    });

    secp_shortcode.generate();
    secp_admin.updateProducts();

    //secp_shortcode.switchShortcodeRead(jQuery("[name=secp_ad_manually]").prop('checked') ? false : true);

    jQuery("[name=secp_ad_manually]").click(function(){
        secp_shortcode.switchShortcodeRead(jQuery(this).prop('checked') ? false : true);
    })

    jQuery('.shopify-selector').click(function(e)
    {
        e.preventDefault();
        var url = '/wp-admin/admin-ajax.php';
        var data =
        {
            'action': 'SECP_shopify_request',
            'endpoint':jQuery(this).data('endpoint'),
            'format': 'json'
        };

        var callback = '';
        secp_admin.currentType = jQuery(this).data('type');
        switch(jQuery(this).data('product-type')){
            case 'collection':
                jQuery('#secp_collections_ids_'+secp_admin.currentType).data('processed', false);
                callback = secp_admin.showCollectionList
                break;
            case 'product':
                jQuery('#secp_product_id_'+secp_admin.currentType).data('processed', false);
                callback = secp_admin.showProductList
                break;
        }

        var html = Mustache.render(ShopifyService.templates['secp-admin-product-selection'], '', []).replace(/^\s*/mg, '');
        jQuery('#secp_popup_content').html(html);
        tb_show('Product selection', '#TB_inline?width=600&height=500&inlineId=secp_popup_content');

        jQuery.ajax
        (
            {
                url: url,
                type: "POST",
                //some times you cant try this method for sending action variable
                //action : 'report_callback',
                data: data,
                success: callback,
                error: function() {
                    secp_admin.currentType = '';
                    console.log("SECP Error loading data...");
                }
            }
        );

        return false;
    })
})


var secp_shortcode =
{
    generate: function()
    {
        secp_shortcode.switchAdFields(jQuery('[name=secp_ad_type]:checked').val() );
        var fields = {};
        jQuery('[data-role=secp_shortcode]').each(function()
        {
            var  $field = jQuery(this);
            var fieldName = $field.attr('name').replace('secp_','');
            var value = '';

            if($field.is(':disabled')){return;}

            switch($field.prop("tagName")){
                case 'INPUT':
                    switch ($field.attr("type") ){
                        case 'radio':
                            if($field.prop('checked')){
                                value =$field.val();
                            }
                            break;
                        case 'checkbox':
                            if($field.prop('checked')){
                                value = 1;
                            }
                            break;
                            break;
                        default:
                            value =$field.val();
                    }
                    break;
                default:
                    value =$field.val();

            }

            if(value != ''){
                fields[fieldName] = value;
            }
        });

        var shortcodeFields = [];
        for(var i in fields)
        {
            shortcodeFields.push(i+'='+'"'+fields[i]+'"');
        }
        jQuery('#secp_shortcode').val('[shopify '+shortcodeFields.join(' ')+']');
    },
    switchAdFields: function(ad_type)
    {
        jQuery('.adtype-container').each(function(){
            if(jQuery(this).data('adtype')!= ad_type ){
                jQuery(this).stop().slideUp();
            }else{
                jQuery(this).stop().slideDown();
            }
        });

        console.log('adtype: '+ad_type)
        if(ad_type == 'collection' || ad_type == 'product')
        {
            jQuery('.adtype-container-common').stop().slideUp();
        }else
        {
            jQuery('.adtype-container-common').stop().slideDown();
        }

        jQuery('[data-adtype='+ad_type+']').stop().slideDown();
    },
    switchShortcodeRead: function( switchValue )
    {
        if(switchValue){
            jQuery('#secp_shortcode_manual').slideUp();
        }else{
            jQuery('#secp_shortcode_manual').slideDown();;
        }
    }
}

var secp_admin = {
    collectionId: '',
    productId: '',
    currentType: '',

    addProduct: function(element) {
        jQuery('#secp_product_id_'+secp_admin.currentType).val(jQuery(element).data('shopify-id'));
        jQuery('#secp_product_variant_id_'+secp_admin.currentType).val(jQuery(element).data('shopify-variant-id'));
        jQuery('#ad_'+secp_admin.currentType).removeClass('secp-ad--inactive').addClass('secp-ad--active');
        secp_admin.updateProducts();
        secp_shortcode.generate();
        tb_remove()
    },

    addCollection: function(element) {
        jQuery('#secp_collections_ids_'+secp_admin.currentType).val(jQuery(element).data('shopify-id'));
        jQuery('#ad_'+secp_admin.currentType).removeClass('secp-ad--inactive').addClass('secp-ad--active');
        secp_admin.updateProducts();
        secp_shortcode.generate();
        tb_remove()
    },

    updateProducts: function(){

        var processing = false;
        jQuery('.secp_product_id').each(function(){
            console.log('Type: '+jQuery(this).data('type'));
            if(jQuery(this).data('processed') !== true) {
                processing = true;
                console.log('processing ' + secp_admin.currentType);
                jQuery(this).data('processed', true);
                secp_admin.currentType = jQuery(this).data('type');
                var productId = jQuery('#secp_product_id_' + secp_admin.currentType).val();
                var productVariantId = jQuery('#secp_product_variant_id_' + secp_admin.currentType).val();

                console.log('product id: '+productId);
                if (productId > 0) {
                    jQuery('#secp-added-product_' + secp_admin.currentType).html('<div class="secp-loader"></div>');
                    secp_api.request({
                        secp_id: productId,
                        secp_variant_id: productVariantId,
                        'endpoint': 'product',
                        callback: 'secp_admin.addSingleProduct'
                    });
                    return false;
                }else{
                    secp_admin.updateProducts();
                    return false;
                }
            }
        });

        if(processing == true){return false;}

        jQuery('.secp_collections_ids').each(function() {
            if (jQuery(this).data('processed') !== true) {
                processing = true;
                jQuery(this).data('processed', true);
                console.log('processing ' + secp_admin.currentType);
                secp_admin.currentType = jQuery(this).data('type');
                var collectionId = jQuery('#secp_collections_ids_' + secp_admin.currentType).val();
                console.log('collectionId: ' + collectionId);
                console.log('id: ' + '#secp_collections_ids_' + secp_admin.currentType);
                if (collectionId > 0) {
                    jQuery('#secp-added-collections_' + secp_admin.currentType).html('<div class="secp-loader"></div>');
                    secp_api.request({
                        secp_id: collectionId,
                        'endpoint': 'collection',
                        callback: 'secp_admin.addSingleCollection'
                    });
                    console.log('processing ' + secp_admin.currentType);
                    return false;
                }else{
                    secp_admin.updateProducts();
                }
            }
        });

        if(processing == true){return false;}

    },

    addSingleProduct: function(response){
        console.log('addSingleProduct');
        var template = ShopifyService.templates['secp-admin-product-list'];
        var html = Mustache.render(template, response.product[0]).replace(/^\s*/mg, '').replace('%type%', secp_admin.currentType);
        jQuery('#secp-added-product_'+secp_admin.currentType).find('.secp-loader').remove();
        jQuery('#secp-added-product_'+secp_admin.currentType).html(html);
        jQuery('#ad_'+secp_admin.currentType).removeClass('secp-ad--inactive').addClass('secp-ad--active');
        console.log('#secp-added-product_'+secp_admin.currentType);
        console.log(html);
        secp_admin.currentType = '';
        secp_admin.updateProducts();
    },

    addSingleCollection: function(response){
        console.log('addSingleCollection');
        var template = ShopifyService.templates['secp-admin-collection'];
        var html = Mustache.render(template, response.collection[0]).replace(/^\s*/mg, '').replace('%type%', secp_admin.currentType);;
        jQuery('#secp-added-collections_'+secp_admin.currentType).find('.secp-loader').remove();
        jQuery('#secp-added-collections_'+secp_admin.currentType).html(html);
        jQuery('#ad_'+secp_admin.currentType).removeClass('secp-ad--inactive').addClass('secp-ad--active');
        console.log('#secp-added-collections_'+secp_admin.currentType);
        console.log(html);
        secp_admin.currentType = '';
        secp_admin.updateProducts();
    },

    showCollectionList: function(response){
        secp_admin.showCollections(response, 'addCollection');
    },

    showProductList: function(response){
        secp_admin.showCollections(response, 'addProduct');
    },

    showCollections: function(response, type){
        jQuery('#secp-admin-collections-container').find('.secp-loader').remove();
        var response =jQuery.parseJSON(response);
        console.log(ShopifyService.templates);
        switch(type){
            case 'addCollection':
                var partials = {"secp-admin-collection-list": ShopifyService.templates['secp-admin-collection-list']};
                break;
            case 'addProduct':
                var partials = {"secp-admin-collection-list": ShopifyService.templates['secp-admin-collection-products-list']};
                break;
        }

        var template = ShopifyService.templates['secp-admin-collections-list'];
        var html = Mustache.render(template, response, partials).replace(/^\s*/mg, '');
        jQuery('#secp-admin-products-container').hide();
        jQuery('#secp-admin-collections-container').html(html).show();
    },

    showProducts: function(response){
        jQuery('#secp-admin-collections-container').find('.secp-loader').remove();
        var partials = {
            "secp-admin-product-list": ShopifyService.templates['secp-admin-product-select-list'],
            "secp-admin-variant-list": ShopifyService.templates['secp-admin-variant-select-list']
        };
        var template = ShopifyService.templates['secp-admin-products-list'];
        var html = Mustache.render(template, response, partials).replace(/^\s*/mg, '');
        jQuery('#secp-admin-collections-container').hide();
        jQuery('#secp-admin-products-container').html(html).show().find('secp-loader').remove();
    },

    loadCollectionProducts: function(element){
        var collectionId = jQuery(element).data('shopify-id');
        jQuery('#secp-admin-collections-container').hide();
        jQuery('#secp-admin-products-container').html('<div class="secp-loader"></div>').show();
        secp_api.request(
            {
                secp_id: collectionId,
                'endpoint': 'collectionProducts',
                callback: 'secp_admin.showProducts'
            })
    },

    backToCollections: function(){
        jQuery('#secp-admin-collections-container').show();
        jQuery('#secp-admin-products-container').hide();
        return false;
    },

    removeProduct: function(type){
        jQuery('#secp-added-product_'+type).find('.secp-product').fadeOut();
        jQuery('#secp_product_id_'+type).val('');
        jQuery('#secp_product_variant_id_'+type).val('');

        jQuery('#ad_'+type).removeClass('secp-ad--active').addClass('secp-ad--inactive');
        console.log(type);
    },

    removeCollection: function(type){
        jQuery('#secp-added-collections_'+type).find('.secp-collection').fadeOut();
        jQuery('#secp_collections_ids_'+type).val('');
        console.log(type);
    }

}
