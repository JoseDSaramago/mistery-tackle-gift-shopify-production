(function () {
console.log('Custon JS loaded')
  //hack to hide variante
document.addEventListener('DOMContentLoaded', HackToHideVariant);
//had to add hack to check changes in dom as shoppyfy 2,0 loads and then mutates dom
const observer = new MutationObserver(() => {
  HackToHideVariant();
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});
//end hack

 // Lock to this page template
   // URL patterns to intercept (path-based)
  const TARGET_PATTERNS = [
    '/cart/47074278244404',   // main SKU
    // add more patterns if needed for later
    // '/cart/123456789',
  ];
  // This is to identify later the url promotion in case tehre will be more infuture
const monthlyPro = ['/cart/47074278244404'];
// function to check taget id part of the list
    let isAddingToCart = false;

const isTarget = (href) => TARGET_PATTERNS.some(pattern => href.includes(pattern));

  document.addEventListener('click', function (e) {
  

    //TO get when on lan ding page 1 the href to copare
    const link = e.target.closest('a[href]');
    console.log('Check Monthly Promotions Landing HR. ');
    const href = link ? link.href : null ;
// to lock only to landing page 2
      const current = window.location.href;
    // console.log('check current ', current);
  // Check if current page contains this substring
  if (current.includes('/pages/best-baits-for-your-buck')) {
    console.log('We are on best-baits-for-your-buck page'); 
    // If we are in the landing page as per path and change selection do not trigger
  // Intercept
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    // avoid issues loop
 if (e.target.closest('select[name="Species"]')) {
  // Click was inside the select  ignore
  return;
}
// once click buy ro continue get the selcted specias from select
const species = getCurrentSpecies();
 if (!species) {
    console.warn('No species selected');
    isAddingToCart = false;
    return;
  }
if(species){
    if (isAddingToCart) return;
  // isAddingToCart = true
console.log('Current species:', species);
 switch (species.value) {
    case 'Bass:1':
      addItemToCartNew(46037856124980,1,2250571828, 'BBPRO');
      break;
    case 'Panfish & Trout:1':
  addItemToCartNew(46037856157748,1,2250571828, 'BBPRO');
    break;
    case 'Inshore Saltwater:1':
  addItemToCartNew(46037856190516,1,2250571828, 'BBPRO');
    break;
    case 'Walleye:1':
      console.log('Monthly Walleye:1');
  addItemToCartNew(46037856223284,1,2250571828, 'BBPRO');
    break;
        case 'Multi-Species:1':
  addItemToCartNew(46037856256052,1,2250571828, 'BBPRO');
    break;
        case 'Ice Fishing:1':
  addItemToCartNew(47197192388660,1,2250571828, 'BBPRO');
    break;
    default:
      console.warn('Unhandled species:', species.value);
      isAddingToCart = false;
      break;
  }
}
  return; // IMPORTANT: do not fall through and call the other fucntions

  }
 
  // no if not in the landing page 1, we check the lick in landing page 2
    if (!link) return;  

    if (!isTarget(href)) return;

    

     console.log('Matched cart link:', href);
    // console.log('BODY CLASSES:', document.body.className);
//    console.log('check selling plans ', product);
    // console.log('check selling plans ', product.selling_plan_groups);
   //[0].selling_plans[0].id

    //  Continue navigation
    //IS monthly pro?
      const isTargetMonthlyPro = (href) => monthlyPro.some(pattern => href.includes(pattern));
        if(isTargetMonthlyPro){
           // Intercept
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
          // The varian id i got it by adding in main-cart.items.liguid as per below a code to set product in a var 
          // <script>
  // window.CART_ITEMS = {{ cart.items | json }};
  // console.log('Cart items:', window.CART_ITEMS);
// </script> <- this goes in the loquid template
          // and I call it as 
          // CART_ITEMS.forEach(i => {
  // console.log(i.product_title, i.quantity, i);
// });
addItemToCartNew(46037856190516,1,2250571828, 'BBPRO');
        }else{

    window.location.href = href;
        }
  }, true);

  function addItemToCartOLD(variant_id, qty, selling_plan) {
    setTimeout(() => {
      
   
  fetch('/cart/add.js', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      id: variant_id,
      quantity: qty,
      selling_plan: selling_plan
    })
  })
  .then(res => res.json())
  .then(data => {
    window.location.href = '/cart';
  })
  .catch(err => {
    console.error('Add to cart error:', err);
  });
   }, 300);
}
function getCurrentSpecies() {
  const select = document.querySelector('select[name="Species"]');
  if (!select) return null;

  return {
    value: select.value,
    label: select.options[select.selectedIndex].text
  };
}

function addItemToCartNew(variant_id, qty, selling_plan, PromoCode) {
  console.log('will addto cart', isAddingToCart);
  if (isAddingToCart) return;
  isAddingToCart = true;
  console.log('will addto cart', isAddingToCart);

  fetch('/cart/add.js', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      id: variant_id,
      quantity: qty,
      selling_plan: selling_plan
    })
  })
  .then(res => {
    if (!res.ok) throw new Error('Cart add failed');
    return res.json();
  })
  .then(() => {
    // ✅ Redirect directly to checkout WITH discount
      console.log('redirect');

    window.location.href = '/checkout?discount='+PromoCode;
  })
  .catch(err => {
    console.error('Add to cart error:', err);
    isAddingToCart = false;
  });
}

function HackToHideVariant(variantId = null, variantText = null, debug = false){
 
    console.log('loaded', true);
  const hiddenOptionValueId = variantId ? variantId : '5195829706804'; // preferred match
  const hiddenOptionText = variantText ? variantText: 'Ice Fishing';     // fallback match

  document.querySelectorAll('option').forEach(option => {
    const optionText = option.textContent?.trim();
    const optionValueId = option.dataset?.optionValueId;

    // Primary: data-option-value-id match
    if (optionValueId === hiddenOptionValueId) {
          console.log('byoptoinID');

      option.remove();
      return;
    }

    // Fallback: visible text match (covers value="Ice Fishing:1")
    if (optionText === hiddenOptionText) {
                console.log('byText');

      option.remove();
    }
  });

}
})();
