// or wherever you import the profile template functions
import { 
    showWorkplaceForm, 
    hideWorkplaceForm, 
    addWorkplace,
    showEducationForm,
    hideEducationForm,
    addEducation 
} from './components/profile/profileTemplate.js';

// Make functions globally available
window.showWorkplaceForm = showWorkplaceForm;
window.hideWorkplaceForm = hideWorkplaceForm;
window.addWorkplace = addWorkplace;
window.showEducationForm = showEducationForm;
window.hideEducationForm = hideEducationForm;
window.addEducation = addEducation; 