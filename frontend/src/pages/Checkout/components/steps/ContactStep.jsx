import ContactForm from "../ContactForm";

function ContactStep({ register, errors, watch, setValue, clearErrors }) {
    return (
        <div className="stepContent">
            <ContactForm
                register={register}
                errors={errors}
                watch={watch}
                setValue={setValue}
                clearErrors={clearErrors}
            />
        </div>
    );
}

export default ContactStep;
