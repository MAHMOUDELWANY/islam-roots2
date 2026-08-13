# Generate Lesson Acceptance Notes

Local production preview was opened at `http://localhost:3000`.

The new Generate Lesson workflow displayed a required `Student *` field. With no students, it showed `No students available. Add a student first.` and an `Add Student` action. The action opened the existing Add Student modal.

A temporary local student record named `Mamadou QA` was created with age `20`, Intermediate level, English target language, and Quran/Tajweed enrollment. After saving and selecting it from the selector, the form displayed the database-backed profile: Mamadou QA, age 20, Intermediate, English, Quran/Tajweed, and curriculum Not assigned. The student selector showed the registered student by ID-backed option rather than a manual name input.

After selection, the subject controls narrowed to Quran and Tajweed and Tajweed-specific learning goals were displayed, including Makharij Practice, Sifat of Letters, Qalqalah, Ghunnah, Madd Rules, Noon Sakinah & Tanween, Meem Sakinah, Tafkheem & Tarqeeq, and Practical Recitation Correction. The local browser check was still in progress for goal pressed-state and request dispatch.

The browser acceptance check confirmed the selected Mamadou QA profile remained visible with age 20 and Intermediate level, and the subject buttons narrowed to Quran and Tajweed. The Tajweed goal chip set was visible in the live form. The goal pressed-state and request dispatch were not conclusively captured through the browser console bridge, so they remain covered by source-level state wiring and subsequent request/payload tests.

A live synthetic Gemini 3.5 Flash structured-output probe using the new priority context returned all 18 required top-level fields with no missing fields. The result mentioned Ayn and Qaf, Makharij, and Intermediate context, returned a 45-minute timing total, and included differentiated activity content. The probe used an explicitly labeled synthetic fixture and did not use a real student record.

After the final rebuild, Arabic/RTL browser review showed the localized required label `الطالب *`, registered-student option `اختر طالباً مسجلاً`, localized goal heading and custom-goal action, Arabic duration options, and an Arabic profile card. Selecting Mamadou QA displayed age 20, Intermediate level, English language, Quran/Tajweed enrollment, and `غير مسند` for missing curriculum data. The UI remained usable and no manual student-name or age field appeared in Lesson Studio.
