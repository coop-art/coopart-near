use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::{env, near_bindgen, setup_alloc};
use near_sdk::serde::{Serialize, Deserialize};
use near_sdk::AccountId;

setup_alloc!();

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize)]
pub struct Welcome {
    pub layers: Vec<Layer>,
}

#[derive(Serialize, Deserialize, BorshDeserialize, BorshSerialize, Clone)]
#[serde(crate = "near_sdk::serde")]
pub struct Layer {
    pub owner_id: AccountId,
    pub token_uri: String,
    pub downvotes: i8,
    pub upvotes: i8,
}

impl Default for Welcome {
  fn default() -> Self {
    Self {
      layers: Vec::new(),
    }
  }
}

#[near_bindgen]
impl Welcome {
    pub fn mint_layer(&mut self, token_uri: String) {
        let owner_id = env::signer_account_id();
        
        let layer = Layer {
            owner_id,
            token_uri,
            downvotes: 0,
            upvotes: 0,
        };
        env::log(format!("Layers increased to '{}'", self.layers.len(),).as_bytes());
        self.layers.push(layer);
    }

    pub fn get_layers(&self) -> Vec<Layer> {
        let newvec = self.layers.to_vec();
        newvec
    }

    // pub fn get_layer(&self, index: usize)  -> Layer {
    //     let newvec = self.layers.to_vec();
    //     let selected = newvec.get(index);

    //     match selected {
    //         Some(x) => *x,
    //         None => Layer {
    //             owner_id: null,
    //             token_uri: "",
    //             downvotes: 0,
    //             upvotes: 0,
    //         };,
    //     }
    // }

    pub fn get_layers_length(&self) -> usize {
        return self.layers.len()
    }

    pub fn increment_downvotes(&mut self, index: usize) {
        self.layers[index].downvotes += 1;
    }

    pub fn increment_upvotes(&mut self, index: usize) {
        self.layers[index].upvotes += 1;
    }

}

/*
 * TESTS
 * cargo test -- --nocapture
 */
#[cfg(test)]
mod tests {
    use super::*;
    use near_sdk::MockedBlockchain;
    use near_sdk::{testing_env, VMContext};

    // mock the context for testing, notice "signer_account_id" that was accessed above from env::
    fn get_context(input: Vec<u8>, is_view: bool) -> VMContext {
        VMContext {
            current_account_id: "alice_near".to_string(),
            signer_account_id: "bob_near".to_string(),
            signer_account_pk: vec![0, 1, 2],
            predecessor_account_id: "carol_near".to_string(),
            input,
            block_index: 0,
            block_timestamp: 0,
            account_balance: 0,
            account_locked_balance: 0,
            storage_usage: 0,
            attached_deposit: 0,
            prepaid_gas: 10u64.pow(18),
            random_seed: vec![0, 1, 2],
            is_view,
            output_data_receivers: vec![],
            epoch_height: 19,
        }
    }

    #[test]
    fn mint_layer() {
        let context = get_context(vec![], false);
        testing_env!(context);
        let mut contract = Welcome::default();
        assert_eq!(0,contract.get_layers_length());
        contract.mint_layer("test".to_string());
        assert_eq!(1,contract.get_layers_length());
    }

    // #[test]
    // fn set_then_get_greeting() {
    //     let context = get_context(vec![], false);
    //     testing_env!(context);
    //     let mut contract = Welcome::default();
    //     contract.set_greeting("howdy".to_string());
    //     assert_eq!(
    //         "howdy".to_string(),
    //         contract.get_greeting("bob_near".to_string())
    //     );
    // }

    // #[test]
    // fn get_default_greeting() {
    //     let context = get_context(vec![], true);
    //     testing_env!(context);
    //     let contract = Welcome::default();
    //     assert_eq!(
    //         "Hello".to_string(),
    //         contract.get_greeting("francis.near".to_string())
    //     );
    // }

    // #[test]
    // fn increment_downvotes() {
    //     let context = get_context(vec![], true);
    //     testing_env!(context);
    //     let mut contract = Welcome::default();
    //     contract.mint_layer("test".to_string());
    //     assert_eq!(0,contract.layers[0].downvotes);
    //     contract.increment_downvotes(0);
    //     // assert_eq!(1,contract.get_layers()[0].downvotes);
    // }
}
