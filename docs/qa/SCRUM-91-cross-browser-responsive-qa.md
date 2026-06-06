# SCRUM-91 Cross-Browser and Responsive QA Sweep

## Tester

Maryam Jumah

## Scope

This QA sweep covered the frontend screens of the Personal Task Manager application, including the dashboard, task table, task forms, modals, buttons, filters, and responsive layout.

## Browsers Tested

| Browser | Result | Notes |
|---|---|---|
| Chrome | Pass | Main screens loaded and displayed correctly. |
| Firefox | Pass | Forms, buttons, task table, and modals worked correctly. |
| Edge | Pass | Layout, filtering, and task actions worked correctly. |
| Mobile browser width | Pass | Layout adjusted properly for smaller screens. |

## Screen Sizes Tested

| Screen Size | Result | Notes |
|---|---|---|
| Desktop | Pass | Dashboard and task table displayed correctly. |
| Tablet | Pass | Content remained readable and usable. |
| Mobile | Pass | Task cards, filters, buttons, and modal forms remained usable. |

## Accessibility Checks

| Check | Result | Notes |
|---|---|---|
| Form labels | Pass | Main form fields have visible labels. |
| Button names | Pass | Icon buttons have meaningful accessible names. |
| Keyboard navigation | Pass | Tab order is logical across forms, filters, and modals. |
| Modal behavior | Pass | Modals use dialog attributes, trap keyboard focus, and close with Escape. |
| Color contrast | Pass | Text, badges, buttons, and error messages are readable. |

## Issues Found and Fixed

| Issue | Location | Status |
|---|---|---|
| Modal needed stronger keyboard support | Add and edit task modals | Fixed |
| Icon buttons needed clearer accessible names | Task table and mobile task cards | Fixed |
| Form errors needed accessible alert behavior | Add and edit task forms | Fixed |
| Search and category inputs needed explicit labels | SearchFilter component | Fixed |
| Mobile layout needed consistent button and input sizing | Main frontend screens | Fixed |

## Summary

The frontend QA sweep confirmed that the main screens are usable across browsers and common screen sizes. Accessibility improvements were added to task forms, task modals, task tables, mobile cards, and search filters. UI issues identified during testing were fixed and verified.