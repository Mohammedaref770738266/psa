// Copyright (c) 2024, Sana'a university and contributors
// For license information, please see license.txt

frappe.ui.form.on("Withdrawal Request", {
    refresh(frm) {
        setTimeout(() => {
            frm.page.actions.find(`[data-label='Help']`).parent().parent().remove();
        }, 500);

        if (frappe.user.has_role('Finance Officer'))
            frm.set_df_property('financial_status', 'read_only', false);

        if (!frm.is_new()) {
            // if (frappe.user_roles.includes("Student")) {
            //     setTimeout(() => {
            //         var fees_status = frm.doc.fees_status;
            //         if (fees_status === "Not Paid") {
            //             frm.add_custom_button(__("Get Code for Fee Payment"), () => {
            //                 frappe.msgprint(__("Payment code for '") + frm.doc.name + __("' is: #########"));
            //             });
            //         }
            //     }, 500);
            // }

            frm.set_df_property("attachment_section", "hidden", false);
            if (frm.doc.request_attachment) {
                frm.set_df_property("request_attachment", "description", "");
            }
            else {
                frm.set_df_property("request_attachment", "description", __("You can attach only pdf file"));
            }

            if (frm.doc.library_eviction) {
                frm.set_df_property("library_eviction", "description", "");
            }
            else {
                frm.set_df_property("library_eviction", "description", __("You can attach only pdf file"));
             }

            var creation_date = frm.doc.creation;
            var formatted_creation_date = creation_date.split(" ")[0] + " " + (creation_date.split(" ")[1]).split(".")[0];

            var modified_date = frm.doc.modified;
            var formatted_modified_date = modified_date.split(" ")[0] + " " + (modified_date.split(" ")[1]).split(".")[0];

            format_single_html_field(frm, "request_date_html", __('Request Date'), formatted_creation_date);

            if (frm.doc.status == "The File Delivered by Archivist") {
                format_single_html_field(frm, "modified_request_date_html", __('File Delivery Date'), formatted_modified_date);
            }
            else if (frm.doc.status == "Rejected by Finance Officer" ||
                frm.doc.status == "Rejected by Director of Graduate Studies") {
                format_single_html_field(frm, "modified_request_date_html", __('Rejection Date'), formatted_modified_date);
            }
            else {
                $(frm.fields_dict["modified_request_date_html"].wrapper).html('');
            }
        }
        else {
            $(frm.fields_dict["request_date_html"].wrapper).html('');
            $(frm.fields_dict["modified_request_date_html"].wrapper).html('');
        }

        if (frm.doc.program_enrollment) {
            get_program_enrollment_status(frm, function (status) {
                get_year_of_enrollment(frm, function (creation_date, full_name_arabic, full_name_english, program, college, department, specialization) {
                    var year_of_enrollment = new Date(creation_date).getFullYear();

                    var array_of_label = [__("Full Name Arabic"), __("Full Name English"), __("Year of Enrollment"), __("Program")];
                    var array_of_value = [full_name_arabic, full_name_english, year_of_enrollment, program];
                    format_multi_html_field(frm, "student_html1", array_of_label, array_of_value);

                    var array_of_label = [__("College"), __("Department"), __("Specialization"), __("Status")];
                    var array_of_value = [college, department, specialization, status];
                    format_multi_html_field(frm, "student_html2", array_of_label, array_of_value);
                });
            });
        }
        else {
            $(frm.fields_dict["student_html1"].wrapper).html('');
            $(frm.fields_dict["student_html2"].wrapper).html('');
        }
    },

    request_attachment(frm) {
        if (frm.doc.request_attachment) {
            frm.set_df_property("request_attachment", "description", "");
        }
        else {
            frm.set_df_property("request_attachment", "description", __("You can attach only pdf file"));
        }
    },

    library_eviction(frm) {
        if (frm.doc.library_eviction) {
            frm.set_df_property("library_eviction", "description", "");
        }
        else {
            frm.set_df_property("library_eviction", "description", __("You can attach only pdf file"));
        }
    },

    // onload(frm) {

    // },

    // before_workflow_action(frm) {
    //     if (frm.selected_workflow_action.includes("Confirm")) {
    //         if (frm.doc.fees_status === "Not Paid") {
    //             frappe.throw(__("Please pay fees first!"));
    //             frappe.validated = false;
    //         }
    //     }
    // },

    // after_workflow_action(frm) {
    //     frappe.msgprint("after_workflow_action");
    // },

    program_enrollment(frm) {
        frm.set_intro('', 'blue');
        if (frm.doc.program_enrollment) {
            get_program_enrollment_status(frm, function (status) {
                get_year_of_enrollment(frm, function (creation_date, full_name_arabic, full_name_english, program, college, department, specialization) {
                    var year_of_enrollment = new Date(creation_date).getFullYear();

                    var array_of_label = [__("Full Name Arabic"), __("Full Name English"), __("Year of Enrollment"), __("Program")];
                    var array_of_value = [full_name_arabic, full_name_english, year_of_enrollment, program];
                    format_multi_html_field(frm, "student_html1", array_of_label, array_of_value);

                    var array_of_label = [__("College"), __("Department"), __("Specialization"), __("Status")];
                    var array_of_value = [college, department, specialization, status];
                    format_multi_html_field(frm, "student_html2", array_of_label, array_of_value);
                });
                if (status == "Continued" || status == "Suspended") {
                    frm.set_intro((__(`Current status is ${status}.`)), 'green');
                }
                else {
                    frm.set_intro((__(`Can't add a withdrawal enrollment request, because current status is ${status}!`)), 'red');
                }
            });
        }
        else {
            $(frm.fields_dict["student_html1"].wrapper).html('');
            $(frm.fields_dict["student_html2"].wrapper).html('');
        }
    },
});



// Custom functions
function get_program(program, callback) {
    frappe.call({
        method: 'frappe.client.get_value',
        args: {
            doctype: 'Program',
            filters: {
                name: program
            },
            fieldname: ['college', 'department', 'specialization']
        },
        callback: function (response) {
            var college = response.message.college;
            var department = response.message.department;
            var specialization = response.message.specialization;
            callback(college, department, specialization);
        }
    });
}


function get_psa_student(creation_date, student_name, program, callback) {
    frappe.call({
        method: 'frappe.client.get_value',
        args: {
            doctype: 'PSA Student',
            filters: {
                name: student_name
            },
            fieldname: ['full_name_arabic', 'full_name_english']
        },
        callback: function (response) {
            var full_name_arabic = response.message.full_name_arabic;
            var full_name_english = response.message.full_name_english;

            get_program(program, function (college, department, specialization) {
                callback(full_name_arabic, full_name_english, creation_date, program, college, department, specialization);
            });
        }
    });
}


function get_year_of_enrollment(frm, callback) {
    frappe.call({
        method: 'frappe.client.get_value',
        args: {
            doctype: 'Program Enrollment',
            filters: {
                name: frm.doc.program_enrollment
            },
            fieldname: ['creation', 'program', 'student']
        },
        callback: function (response) {
            var creation_date = response.message.creation;
            var student_name = response.message.student;
            var program = response.message.program;

            get_psa_student(creation_date, student_name, program, function (full_name_arabic, full_name_english, creation_date, program, college, department, specialization) {
                callback(creation_date, full_name_arabic, full_name_english, program, college, department, specialization);
            });
        }
    });
}


function get_program_enrollment_status(frm, callback) {
    frappe.call({
        method: 'frappe.client.get_value',
        args: {
            doctype: 'Program Enrollment',
            filters: {
                name: frm.doc.program_enrollment
            },
            fieldname: ['status']
        },
        callback: function (response) {
            var status = response.message.status;
            callback(status);
        }
    });
}


function format_single_html_field(frm, html_field_name, field_label, field_value) {
    $(frm.fields_dict[html_field_name].wrapper).html(
        `<div class="form-group">
          <div class="clearfix">
            <label class="control-label" style="padding-right: 0px;">`
        + field_label +
        `</label>
          </div>
          <div class="control-input-wrapper">
            <div class="control-value like-disabled-input">`
        + field_value +
        `</div>
          </div>
        </div>`
    );
}


function format_multi_html_field(frm, html_field_name, array_of_label, array_of_value) {
    var html_content = "";

    for (let i = 0; i < array_of_label.length; i++) {
        const label = array_of_label[i];
        const value = array_of_value[i];

        html_content = html_content + `<div class="form-group">
          <div class="clearfix">
            <label class="control-label" style="padding-right: 0px;">`
            + label +
            `</label>
          </div>
          <div class="control-input-wrapper">
            <div class="control-value like-disabled-input">`
            + value +
            `</div>
          </div>
        </div>`;
    }

    $(frm.fields_dict[html_field_name].wrapper).html(html_content);
}