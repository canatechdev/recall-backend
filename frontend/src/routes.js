import React from 'react'

const Dashboard = React.lazy(() => import('./views/dashboard/Dashboard'))
const Listings = React.lazy(() => import('./views/pages/Listings'))
const Users = React.lazy(() => import('./views/pages/users/Users'))
const AddUser = React.lazy(() => import('./views/pages/users/AddUser'))
const Typography = React.lazy(() => import('./views/theme/typography/Typography'))



// CUSTOM
const Services = React.lazy(() => import('./views/pages/system/Services'));
const Categories = React.lazy(() => import('./views/pages/system/Categories'));
const Brands = React.lazy(() => import('./views/pages/system/Brands'));
const Products = React.lazy(() => import('./views/pages/products/Products'));
const AddProducts = React.lazy(() => import('./views/pages/products/AddProducts'));
const BrandModelManager = React.lazy(() => import('./views/pages/system/BrandModelManager'));
const SellQuestions = React.lazy(() => import('./views/pages/sell/SellQuestions'));
// const AddHomeBanner = React.lazy(() => import('./views/pages/banners/AddHomeBanner'));
// const HomeBanner = React.lazy(() => import('./views/pages/banners/HomeBanner'));

// BANNERS
const HomeBanner = React.lazy(() => import('./views/pages/banners/HomeBanner'));
const AddHomeBanner = React.lazy(() => import('./views/pages/banners/AddHomeBanner'));
const EditBanner = React.lazy(() => import('./views/pages/banners/EditBanner'));

// FAQS  ⭐ ADDED
const HomeFaqs = React.lazy(() => import('./views/pages/faqs/HomeFaq'));
const AddFaq = React.lazy(() => import('./views/pages/faqs/AddFaq'));
const EditFaq = React.lazy(() => import('./views/pages/faqs/EditFaq'));

// TEST THEME
const TestTheme = React.lazy(() => import('./views/pages/system/TestTheme'));

// Base
// const Accordion = React.lazy(() => import('./views/base/accordion/Accordion'))
const Breadcrumbs = React.lazy(() => import('./views/base/breadcrumbs/Breadcrumbs'))
// const Cards = React.lazy(() => import('./views/base/cards/Cards'))
const Carousels = React.lazy(() => import('./views/base/carousels/Carousels'))
const Collapses = React.lazy(() => import('./views/base/collapses/Collapses'))
const ListGroups = React.lazy(() => import('./views/base/list-groups/ListGroups'))
const Navs = React.lazy(() => import('./views/base/navs/Navs'))
const Paginations = React.lazy(() => import('./views/base/paginations/Paginations'))
const Placeholders = React.lazy(() => import('./views/base/placeholders/Placeholders'))
// const Popovers = React.lazy(() => import('./views/base/popovers/Popovers'))
// const Progress = React.lazy(() => import('./views/base/progress/Progress'))
const Spinners = React.lazy(() => import('./views/base/spinners/Spinners'))
// const Tabs = React.lazy(() => import('./views/base/tabs/Tabs'))
// const Tables = React.lazy(() => import('./views/base/tables/Tables'))
// const Tooltips = React.lazy(() => import('./views/base/tooltips/Tooltips'))

// Buttons
// const Buttons = React.lazy(() => import('./views/buttons/buttons/Buttons'))
// const ButtonGroups = React.lazy(() => import('./views/buttons/button-groups/ButtonGroups'))
// const Dropdowns = React.lazy(() => import('./views/buttons/dropdowns/Dropdowns'))

//Forms
// const ChecksRadios = React.lazy(() => import('./views/forms/checks-radios/ChecksRadios'))
// const FloatingLabels = React.lazy(() => import('./views/forms/floating-labels/FloatingLabels'))
// const FormControl = React.lazy(() => import('./views/forms/form-control/FormControl'))
// const InputGroup = React.lazy(() => import('./views/forms/input-group/InputGroup'))
// const Layout = React.lazy(() => import('./views/forms/layout/Layout'))
// const Range = React.lazy(() => import('./views/forms/range/Range'))
// const Select = React.lazy(() => import('./views/forms/select/Select'))
// const Validation = React.lazy(() => import('./views/forms/validation/Validation'))

// const Charts = React.lazy(() => import('./views/charts/Charts'))

// Icons
const CoreUIIcons = React.lazy(() => import('./views/icons/coreui-icons/CoreUIIcons'))
const Flags = React.lazy(() => import('./views/icons/flags/Flags'))

// Notifications
const Alerts = React.lazy(() => import('./views/notifications/alerts/Alerts'))
const Badges = React.lazy(() => import('./views/notifications/badges/Badges'))
const Modals = React.lazy(() => import('./views/notifications/modals/Modals'))
const Toasts = React.lazy(() => import('./views/notifications/toasts/Toasts'))

const Widgets = React.lazy(() => import('./views/widgets/Widgets'))

const routes = [
  { path: '/', exact: true, name: 'Home' },
  { path: '/dashboard', name: 'Dashboard', element: Dashboard },




  { path: '/users', name: 'Users', element: Users, exact: true },
  { path: '/users/add', name: 'Add', element: AddUser },
  { path: '/leads', name: 'Leads', element: Listings, exact: true },
  { path: '/leads/rejected', name: 'Rejected', element: Listings },

  { path: '/services', name: 'Services', element: Services, exact: true },
  { path: '/services/manage', name: 'Manage', element: Services },
  { path: '/services/new', name: 'New', element: Brands },

  { path: '/categories', name: 'Categories', element: Categories, exact: true },
  { path: '/categories/manage', name: 'Manage', element: Categories },

  { path: '/brands', name: 'Brands', element: Brands, exact: true },
  { path: '/brands/manage', name: 'Manage', element: Brands },

  { path: '/products', name: 'Products', element: Products, exact: true },
  { path: '/products/add', name: 'Manage', element: AddProducts },

  { path: '/models/manage', name: 'Manage', element: BrandModelManager },

  { path: '/sell', name: 'Sell Flow', exact: true },
  { path: '/sell/questions', name: 'Sell Questions', element: SellQuestions },

  { path: '/banners', name: 'Manage', element: HomeBanner },
  { path: '/banners/add', name: 'Add', element: AddHomeBanner },
  { path: '/banners/edit/:id', name: 'Edit', element: EditBanner },

  // FAQS ⭐
  { path: '/faqs', name: 'Manage FAQs', element: HomeFaqs },
  { path: '/faqs/add', name: 'Add FAQ', element: AddFaq },
  { path: '/faqs/edit/:id', name: 'Edit FAQ', element: EditFaq },
  { path: '/theme/test', name: 'Test Theme', element: TestTheme },

  { path: '/theme', name: 'Theme', element: TestTheme, exact: true },
  { path: '/theme/colors', name: 'Colors', element: TestTheme },
  { path: '/theme/typography', name: 'Typography', element: Typography },
  { path: '/base', name: 'Base', element: TestTheme, exact: true },
  { path: '/base/breadcrumbs', name: 'Breadcrumbs', element: Breadcrumbs },
  { path: '/base/cards', name: 'Cards', element: Brands },
  { path: '/base/carousels', name: 'Carousel', element: Carousels },
  { path: '/base/collapses', name: 'Collapse', element: Collapses },
  { path: '/base/list-groups', name: 'List Groups', element: ListGroups },
  { path: '/base/navs', name: 'Navs', element: Navs },
  { path: '/base/paginations', name: 'Paginations', element: Paginations },
  { path: '/base/placeholders', name: 'Placeholders', element: Placeholders },
  { path: '/base/popovers', name: 'Popovers', element: Brands },
  { path: '/base/progress', name: 'Progress', element: Brands },
  { path: '/base/spinners', name: 'Spinners', element: Spinners },
  { path: '/base/tabs', name: 'Tabs', element: Brands },
  { path: '/base/tables', name: 'Tables', element: Brands },
  { path: '/base/tooltips', name: 'Tooltips', element: Brands },
  { path: '/buttons', name: 'Buttons', element: Brands, exact: true },
  { path: '/buttons/buttons', name: 'Buttons', element: Brands },
  { path: '/buttons/dropdowns', name: 'Dropdowns', element: Brands },
  { path: '/buttons/button-groups', name: 'Button Groups', element: Brands },
  { path: '/charts', name: 'Charts', element: Brands },
  { path: '/forms', name: 'Forms', element: Brands, exact: true },
  { path: '/forms/form-control', name: 'Form Control', element: Brands },
  { path: '/forms/select', name: 'Select', element: Brands },
  { path: '/forms/checks-radios', name: 'Checks & Radios', element: Brands },
  { path: '/forms/range', name: 'Range', element: Brands },
  { path: '/forms/input-group', name: 'Input Group', element: Brands },
  { path: '/forms/floating-labels', name: 'Floating Labels', element: Brands },
  { path: '/forms/layout', name: 'Layout', element: Brands },
  { path: '/forms/validation', name: 'Validation', element: Brands },
  { path: '/icons', exact: true, name: 'Icons', element: CoreUIIcons },
  { path: '/icons/coreui-icons', name: 'CoreUI Icons', element: CoreUIIcons },
  { path: '/icons/flags', name: 'Flags', element: Flags },
  { path: '/icons/brands', name: 'Brands', element: Brands },
  { path: '/notifications', name: 'Notifications', element: Alerts, exact: true },
  { path: '/notifications/alerts', name: 'Alerts', element: Alerts },
  { path: '/notifications/badges', name: 'Badges', element: Badges },
  { path: '/notifications/modals', name: 'Modals', element: Modals },
  { path: '/notifications/toasts', name: 'Toasts', element: Toasts },
  { path: '/widgets', name: 'Widgets', element: Widgets },
]

export default routes
