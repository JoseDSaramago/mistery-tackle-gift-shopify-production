const { pathname } = window.location;  
const basePath = pathname?.split('/')[1] || '';

const pathsToRedirectToRecurring = [ '/account/login', '/account/register' ];

const basePathToRedirectToPlans = [ 'collections', 'products' ];
const pathsToRedirectToPlans = [
  '/collections',
  '/products',
  '/collections/frontpage',
  '/collections/single-purchase-products'
];
const productRedirectException = '/products/the-ultimate';

if (pathsToRedirectToRecurring.includes(pathname)) {
  window.location.replace('/tools/recurring/get-subscription-access?passwordless=true');
}

// Uncomment this code to enable redirection from PDP pages
// if (basePathToRedirectToPlans.includes(basePath) && pathname !== productRedirectException) {
  // window.location.replace("/pages/plans");
// }

// if (pathsToRedirectToPlans.includes(pathname)) {
  // window.location.replace("/pages/plans");
// }