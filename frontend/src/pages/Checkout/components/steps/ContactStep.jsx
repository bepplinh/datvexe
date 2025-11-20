import ContactForm from "../ContactForm";

function ContactStep({ contactInfo, onChange }) {
    return (
        <div className="stepContent">
            <ContactForm values={contactInfo} onChange={onChange} />
        </div>
    );
}

export default ContactStep;
